import {
  HTMLVideoElement as SemanticVideo,
  Event as SemanticEvent,
  bindVideoPlayback,
  publishVideoPlaybackState,
  subscribeDocumentVideoChanges,
  type Document,
} from "@zavx0z/immersive-dom"
import {TextureLoader, type TextureLease} from "@zavx0z/immersive-webgpu"

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
}): Readonly<{dispose(): void}> {
  const entries = new Map<SemanticVideo, Entry>()
  let disposed = false
  let syncing = false
  const events = ["loadedmetadata", "loadeddata", "canplay", "playing", "pause", "waiting", "stalled", "resize", "timeupdate", "ended", "error", "emptied"]

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
    if (entry.frame !== null) entry.native.cancelVideoFrameCallback?.(entry.frame)
    entry.frame = null
  }
  const scheduleFrame = (entry: Entry): void => {
    if (!entry.active || disposed || entry.frame !== null || entry.native.paused || entry.native.ended) return
    // На старых host без RVFC timeupdate остаётся источником общего кадра.
    if (typeof entry.native.requestVideoFrameCallback !== "function") return
    entry.frame = entry.native.requestVideoFrameCallback(() => {
      entry.frame = null
      if (!entry.active || disposed) return
      publish(entry)
      if (!entry.active || disposed) return
      options.requestFrame()
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
      releaseBinding: () => {}, listeners: new Map(), frame: null,
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
        options.requestFrame()
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
        options.requestFrame()
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
        options.requestFrame()
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
    if (video.isConnected && !disposed) options.requestFrame()
  })
  try { sync() } catch (error) {
    disposed = true
    unsubscribeMutations()
    unsubscribeVideo()
    for (const entry of [...entries.values()]) release(entry)
    throw error
  }
  return Object.freeze({dispose() {
    if (disposed) return
    disposed = true
    unsubscribeMutations()
    unsubscribeVideo()
    for (const entry of [...entries.values()]) release(entry)
  }})
}
