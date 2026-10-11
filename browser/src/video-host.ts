import {
  HTMLVideoElement as SemanticVideo,
  Event as SemanticEvent,
  bindVideoPlayback,
  publishVideoPlaybackState,
  subscribeDocumentVideoChanges,
  type Document,
} from "@zavx0z/immersive-dom"
import {TextureLoader, type TextureLease} from "@zavx0z/immersive-webgpu"
import type {ImageDisplayItem, RenderFrame, RenderTransform} from "@zavx0z/immersive-renderer-html"

const presentedVideosByFrame = new WeakMap<RenderFrame, ReadonlySet<SemanticVideo>>()

/** Video paint intersecting its projection viewport and resolved overflow clips. */
export function readPresentedVideos(frames: Iterable<RenderFrame>): ReadonlySet<SemanticVideo> {
  const videos = new Set<SemanticVideo>()
  for (const frame of frames) {
    let presented = presentedVideosByFrame.get(frame)
    if (presented === undefined) {
      const collected = new Set<SemanticVideo>()
      for (const item of frame.displayList) {
        if (item.kind === "image" && item.node instanceof SemanticVideo && videoPaintVisible(frame, item)) collected.add(item.node)
      }
      presented = collected
      presentedVideosByFrame.set(frame, presented)
    }
    for (const video of presented) videos.add(video)
  }
  return videos
}

type Bounds = Readonly<{left: number; top: number; right: number; bottom: number}>

const transformedBounds = (rect: Readonly<{x: number; y: number; width: number; height: number}>, transform: RenderTransform): Bounds | null => {
  const x = rect.x * transform.scaleX + transform.translateX
  const y = rect.y * transform.scaleY + transform.translateY
  const right = (rect.x + rect.width) * transform.scaleX + transform.translateX
  const bottom = (rect.y + rect.height) * transform.scaleY + transform.translateY
  if (![x, y, right, bottom].every(Number.isFinite)) return null
  return {left: Math.min(x, right), top: Math.min(y, bottom), right: Math.max(x, right), bottom: Math.max(y, bottom)}
}

const videoPaintVisible = (frame: RenderFrame, item: ImageDisplayItem): boolean => {
  if (item.opacity <= 0 || item.width <= 0 || item.height <= 0) return false
  const bounds = transformedBounds(item, item.transform)
  // Invalid or future unsupported geometry must not accidentally suspend visible playback.
  if (bounds === null || !Number.isFinite(frame.viewport.width) || !Number.isFinite(frame.viewport.height)) return true
  let left = Math.max(0, bounds.left)
  let top = Math.max(0, bounds.top)
  let right = Math.min(frame.viewport.width, bounds.right)
  let bottom = Math.min(frame.viewport.height, bounds.bottom)
  for (const clip of item.clips) {
    const transform = clip.presentationOwner === null || clip.presentationOwner === undefined
      ? clip.transform
      : frame.presentationTransforms?.get(clip.presentationOwner) ?? clip.transform
    const clipping = transformedBounds(clip, transform)
    if (clipping === null) continue
    // Rounded corners are conservatively represented by their containing rectangle.
    if (clip.clipX) {
      left = Math.max(left, clipping.left)
      right = Math.min(right, clipping.right)
    }
    if (clip.clipY) {
      top = Math.max(top, clipping.top)
      bottom = Math.min(bottom, clipping.bottom)
    }
  }
  return left < right && top < bottom
}

export type VideoHostSeams = Readonly<{
  createVideo(): HTMLVideoElement
  publishSource(src: string, video: HTMLVideoElement, width: number, height: number): void
  releaseSource(src: string): void
}>

type Entry = {
  semantic: SemanticVideo
  native: HTMLVideoElement
  source: object | null
  src: string
  resource: string
  sourceLease: TextureLease
  publishedWidth: number
  publishedHeight: number
  releaseBinding(): void
  listeners: Map<string, () => void>
  frame: number | null
  frameEpoch: number
  active: boolean
  time: number
}
let nextResource = 0

/** Один decoder на semantic video; кадры запрашивают общий presentation lifecycle. */
export function createDocumentVideoHost(options: Readonly<{
  document: Document
  nativeDocument: globalThis.Document | undefined
  requestFrame(): void
}>, seams: VideoHostSeams = {
  createVideo: () => {
    if (options.nativeDocument === undefined) throw new Error("Native Document is required to decode video")
    return options.nativeDocument.createElement("video")
  },
  publishSource: (src, video, width, height) => { TextureLoader.replaceExternalSource(src, video, width, height) },
  releaseSource: src => TextureLoader.releaseVideoSource(src),
}): Readonly<{
  setPresentedVideos(videos: Iterable<SemanticVideo>): void
  dispose(): void
}> {
  const entries = new Map<SemanticVideo, Entry>()
  let presentedVideos: ReadonlySet<SemanticVideo> | null = null
  let disposed = false
  let syncing = false
  const events = ["loadedmetadata", "loadeddata", "canplay", "playing", "pause", "waiting", "stalled", "resize", "timeupdate", "ended", "error", "emptied"]
  const pageVisible = (): boolean => options.nativeDocument?.visibilityState !== "hidden"
  const isPresented = (entry: Entry): boolean => presentedVideos === null || presentedVideos.has(entry.semantic)
  const requestPresentation = (entry: Entry): void => {
    if (entry.active && !disposed && pageVisible() && isPresented(entry)) options.requestFrame()
  }

  const publish = (entry: Entry): void => {
    if (!entry.active || disposed) return
    const video = entry.native
    const width = video.videoWidth
    const height = video.videoHeight
    const ready = video.readyState >= 2 && width > 0 && height > 0
    if (ready && (entry.publishedWidth !== width || entry.publishedHeight !== height)) {
      seams.publishSource(entry.resource, video, width, height)
      entry.publishedWidth = width
      entry.publishedHeight = height
    }
    publishVideoPlaybackState(entry.semantic, {
      paused: video.paused,
      readyState: video.readyState,
      currentTime: video.currentTime,
      videoWidth: width,
      videoHeight: height,
      error: video.error === null ? null : {code: video.error.code, message: video.error.message},
      resource: ready ? entry.resource : null,
    })
  }

  const cancelFrame = (entry: Entry): void => {
    entry.frameEpoch++
    if (entry.frame !== null) entry.native.cancelVideoFrameCallback?.(entry.frame)
    entry.frame = null
  }
  const scheduleFrame = (entry: Entry): void => {
    if (!entry.active || disposed || !pageVisible() || !isPresented(entry) || entry.frame !== null || entry.native.paused || entry.native.ended) return
    // На старых host без RVFC timeupdate остаётся источником общего кадра.
    if (typeof entry.native.requestVideoFrameCallback !== "function") return
    const epoch = entry.frameEpoch
    entry.frame = entry.native.requestVideoFrameCallback(() => {
      if (entry.frameEpoch !== epoch) return
      entry.frame = null
      if (!entry.active || disposed || !pageVisible() || !isPresented(entry)) return
      publish(entry)
      if (!entry.active || disposed) return
      requestPresentation(entry)
      scheduleFrame(entry)
    })
  }

  const release = (entry: Entry): void => {
    entry.active = false
    cancelFrame(entry)
    for (const [type, listener] of entry.listeners) entry.native.removeEventListener(type, listener)
    entry.listeners.clear()
    entry.native.pause()
    entry.native.srcObject = null
    entry.native.removeAttribute("src")
    entry.native.load()
    entry.sourceLease.release()
    seams.releaseSource(entry.resource)
    entry.releaseBinding()
    entries.delete(entry.semantic)
  }

  const configure = (entry: Entry): void => {
    const semantic = entry.semantic
    const native = entry.native
    native.muted = semantic.muted
    native.defaultMuted = semantic.defaultMuted
    native.autoplay = semantic.autoplay
    native.playsInline = semantic.playsInline
    native.loop = semantic.loop
    const request = semantic.readPlaybackRequest()
    if (request.currentTime !== entry.time) {
      entry.time = request.currentTime
      native.currentTime = entry.time
    }
  }

  const create = (semantic: SemanticVideo): Entry => {
    const native = seams.createVideo()
    const resource = `metafor:video/${++nextResource}`
    const entry: Entry = {
      semantic, native, source: semantic.srcObject, src: semantic.src,
      resource,
      sourceLease: TextureLoader.acquire(resource, () => {}, {animate: false}),
      publishedWidth: 0, publishedHeight: 0,
      releaseBinding: () => {}, listeners: new Map(), frame: null, frameEpoch: 0,
      active: true, time: 0,
    }
    entries.set(semantic, entry)
    configure(entry)
    for (const type of events) {
      const listener = (): void => {
        if (!entry.active || disposed) return
        publish(entry)
        semantic.dispatchEvent(new SemanticEvent(type))
        if (!entry.active || disposed) return
        if (native.paused || native.ended) cancelFrame(entry)
        else scheduleFrame(entry)
        requestPresentation(entry)
      }
      entry.listeners.set(type, listener)
      native.addEventListener(type, listener)
    }
    if (entry.source !== null) native.srcObject = entry.source as HTMLVideoElement["srcObject"]
    else if (entry.src !== "") native.src = entry.src
    entry.releaseBinding = bindVideoPlayback(semantic, {
      async play() {
        if (!entry.active) throw new DOMException("Video detached", "AbortError")
        await native.play()
        if (!entry.active) throw new DOMException("Video detached", "AbortError")
        publish(entry)
        scheduleFrame(entry)
        requestPresentation(entry)
      },
      pause() {
        native.pause()
        cancelFrame(entry)
        publish(entry)
      },
    })
    if (semantic.autoplay && !semantic.readPlaybackRequest().playing) {
      void native.play().then(() => {
        if (!entry.active || disposed) return
        publish(entry)
        scheduleFrame(entry)
        requestPresentation(entry)
      }).catch(() => {})
    }
    publish(entry)
    return entry
  }

  const sync = (): void => {
    if (disposed || syncing) return
    syncing = true
    try {
      const videos = new Set(options.document.querySelectorAll("video"))
      for (const entry of [...entries.values()]) {
        if (!videos.has(entry.semantic) || entry.source !== entry.semantic.srcObject || entry.src !== entry.semantic.src) release(entry)
      }
      for (const video of videos) {
        if (!(video instanceof SemanticVideo)) continue
        const entry = entries.get(video)
        if (entry === undefined) create(video)
        else configure(entry)
      }
    } finally { syncing = false }
  }
  const unsubscribeMutations = options.document.subscribeMutations(batch => {
    const affectsVideo = batch.records.some(record => {
      if (record.type === "attributes") return record.target instanceof SemanticVideo
      if (record.type !== "childList") return false
      return [...record.addedNodes, ...record.removedNodes].some(node =>
        node instanceof SemanticVideo || "querySelector" in node && typeof node.querySelector === "function" && node.querySelector("video") !== null
      )
    })
    if (affectsVideo) sync()
  })
  const unsubscribeVideo = subscribeDocumentVideoChanges(options.document, video => {
    sync()
    const entry = entries.get(video)
    if (entry !== undefined) requestPresentation(entry)
  })
  const onVisibilityChange = (): void => {
    if (disposed) return
    if (!pageVisible()) {
      for (const entry of entries.values()) cancelFrame(entry)
      return
    }
    for (const entry of entries.values()) {
      publish(entry)
      scheduleFrame(entry)
    }
    const presented = [...entries.values()].find(isPresented)
    if (presented !== undefined) requestPresentation(presented)
  }
  options.nativeDocument?.addEventListener("visibilitychange", onVisibilityChange)
  try { sync() } catch (error) {
    disposed = true
    unsubscribeMutations()
    unsubscribeVideo()
    options.nativeDocument?.removeEventListener("visibilitychange", onVisibilityChange)
    for (const entry of [...entries.values()]) release(entry)
    throw error
  }
  return Object.freeze({
    /** Актуальные video из общего paint/projection frame; playback и decoder сохраняются. */
    setPresentedVideos(videos: Iterable<SemanticVideo>) {
      if (disposed) return
      const previous = presentedVideos
      presentedVideos = new Set(videos)
      for (const entry of entries.values()) {
        if (!isPresented(entry)) cancelFrame(entry)
        else if (previous !== null && !previous.has(entry.semantic)) {
          scheduleFrame(entry)
          requestPresentation(entry)
        }
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      unsubscribeMutations()
      unsubscribeVideo()
      options.nativeDocument?.removeEventListener("visibilitychange", onVisibilityChange)
      for (const entry of [...entries.values()]) release(entry)
    },
  })
}
