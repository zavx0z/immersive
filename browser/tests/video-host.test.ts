import {expect, test} from "bun:test"
import {createDocument, readVideoPlaybackState, publishVideoPlaybackState} from "../../dom/src/index.ts"
import {createDocumentInteractionController, createDocumentRenderer, type ImageDisplayItem, type RenderFrame} from "../../renderer/html/src/index.ts"
import {createDocumentVideoHost, readPresentedVideos} from "../src/video-host.ts"
import {createDocumentPlaneRuntime} from "../src/plane-runtime.ts"
import {createDocumentOverlayRuntime} from "../src/overlay-runtime.ts"
import {createDocumentCanvasRuntimeWithSeams} from "../src/runtime.ts"
import {createDocumentSpaceRuntimeWithSeams} from "../src/space-runtime.ts"
import type {DocumentNativeInputHost} from "../src/native-input-host.ts"
import {RendererWebGpuBackend, RendererWebGpuScreenOverlay, type Renderer} from "@zavx0z/immersive-webgpu"
import {Raycaster, Space, ViewPoint, type TrueTypeFont} from "@zavx0z/immersive-engine"

class Decoder extends EventTarget {
  srcObject: object | null = null
  src = ""
  muted = false
  defaultMuted = false
  autoplay = false
  playsInline = false
  loop = false
  paused = true
  ended = false
  readyState = 0
  currentTime = 0
  videoWidth = 0
  videoHeight = 0
  error: {code: number; message: string} | null = null
  plays = 0
  pauses = 0
  loads = 0
  cancelled: number[] = []
  frames = new Map<number, () => void>()
  nextFrame = 0
  async play() {
    this.plays++
    this.paused = false
    this.dispatchEvent(new Event("playing"))
  }
  pause() {
    this.pauses++
    this.paused = true
  }
  load() { this.loads++ }
  removeAttribute(name: string) { if (name === "src") this.src = "" }
  requestVideoFrameCallback(callback: () => void) {
    const id = ++this.nextFrame
    this.frames.set(id, callback)
    return id
  }
  cancelVideoFrameCallback(id: number) {
    this.cancelled.push(id)
    this.frames.delete(id)
  }
  frame() {
    const [id, callback] = [...this.frames][0]!
    this.frames.delete(id)
    this.currentTime += 1 / 30
    callback()
  }
  ready(width = 640, height = 480) {
    this.videoWidth = width
    this.videoHeight = height
    this.readyState = 2
    this.dispatchEvent(new Event("loadedmetadata"))
    this.dispatchEvent(new Event("canplay"))
  }
}

class NativePage extends EventTarget {
  visibilityState: DocumentVisibilityState = "visible"
  visibilityListeners = 0
  readonly decoders: Decoder[] = []
  fullscreenEnabled = true
  fullscreenElement: HTMLCanvasElement | null = null
  createElement(tag: string) {
    if (tag !== "video") throw new Error(`Unexpected native element: ${tag}`)
    const decoder = new Decoder()
    this.decoders.push(decoder)
    return decoder
  }
  async exitFullscreen() {
    this.fullscreenElement = null
    this.dispatchEvent(new Event("fullscreenchange"))
  }
  override addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
    if (type === "visibilitychange") this.visibilityListeners++
    super.addEventListener(type, listener, options)
  }
  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) {
    if (type === "visibilitychange") this.visibilityListeners--
    super.removeEventListener(type, listener, options)
  }
  visibility(state: DocumentVisibilityState) {
    this.visibilityState = state
    this.dispatchEvent(new Event("visibilitychange"))
  }
}

function fixture(nativePage?: NativePage) {
  const document = createDocument()
  const root = document.createElement("div")
  document.append(root)
  const decoders: Decoder[] = []
  const published: {src: string; decoder: Decoder; width: number; height: number}[] = []
  const released: string[] = []
  let frames = 0
  const host = createDocumentVideoHost({document, nativeDocument: nativePage as unknown as Document | undefined, requestFrame() { frames++ }}, {
    createVideo() {
      const decoder = new Decoder()
      decoders.push(decoder)
      return decoder as unknown as HTMLVideoElement
    },
    publishSource(src, decoder, width, height) { published.push({src, decoder: decoder as unknown as Decoder, width, height}) },
    releaseSource(src) { released.push(src) },
  })
  return {document, root, host, decoders, published, released, get frames() { return frames }}
}

test("stream attachment produces semantic paint, forwards events and schedules fresh frames without source republishing", async () => {
  const f = fixture()
  const video = f.document.createElement("video")
  const stream = {getTracks() { throw new Error("Browser must not stop caller tracks") }}
  video.srcObject = stream
  video.muted = true
  video.playsInline = true
  const events: string[] = []
  for (const name of ["playing", "loadedmetadata", "canplay", "waiting", "stalled"]) video.addEventListener(name, () => events.push(name))
  const play = video.play()
  f.root.append(video)
  const renderer = createDocumentRenderer({document: f.document, root: f.root, viewport: {width: 800, height: 600}})
  try {
    await play
    const decoder = f.decoders[0]!
    expect(decoder.srcObject).toBe(stream)
    expect(decoder.muted).toBeTrue()
    expect(decoder.playsInline).toBeTrue()
    decoder.ready()
    const frame = renderer.flush()
    expect(frame.displayList.find(item => item.kind === "image")).toMatchObject({src: f.published[0]!.src, width: 640, height: 480})
    const requested = f.frames
    decoder.frame()
    expect(f.frames).toBeGreaterThan(requested)
    expect(video.currentTime).toBeGreaterThan(0)
    expect(f.published).toHaveLength(1)
    expect(readVideoPlaybackState(video).resource).toBe(f.published[0]!.src)
    decoder.dispatchEvent(new Event("waiting"))
    decoder.dispatchEvent(new Event("stalled"))
    expect(events).toEqual(expect.arrayContaining(["playing", "loadedmetadata", "canplay", "waiting", "stalled"]))
  } finally {
    renderer.dispose()
    f.host.dispose()
  }
})

test("source replacement, detach, reparent and disposal cancel stale decoder callbacks and release texture source", async () => {
  const f = fixture()
  const video = f.document.createElement("video")
  video.srcObject = {}
  video.autoplay = true
  f.root.append(video)
  await Bun.sleep(0)
  const first = f.decoders[0]!
  first.ready()
  const stale = [...first.frames.values()][0]!
  const destination = f.document.createElement("div")
  f.root.append(destination)
  f.document.transaction(() => destination.append(video))
  expect(f.decoders).toHaveLength(1)
  video.srcObject = {}
  await Bun.sleep(0)
  expect(f.decoders).toHaveLength(2)
  expect(first.srcObject).toBeNull()
  expect(first.cancelled).toHaveLength(1)
  const requested = f.frames
  stale()
  first.dispatchEvent(new Event("loadedmetadata"))
  expect(f.frames).toBe(requested)
  expect(f.released).toEqual([f.published[0]!.src])
  const second = f.decoders[1]!
  second.ready(1920, 1080)
  video.remove()
  expect(second.frames.size).toBe(0)
  expect(second.srcObject).toBeNull()
  expect(video.videoWidth).toBe(0)
  f.root.append(video)
  await Bun.sleep(0)
  const third = f.decoders[2]!
  third.ready()
  f.host.dispose()
  f.host.dispose()
  expect(third.frames.size).toBe(0)
  expect(f.released).toHaveLength(3)
})

test("pause cancels video frame callback and mute/seek update the existing decoder", async () => {
  const f = fixture()
  const video = f.document.createElement("video")
  video.src = "fixture.mp4"
  f.root.append(video)
  await video.play()
  const decoder = f.decoders[0]!
  decoder.ready()
  video.muted = true
  video.currentTime = 4
  expect(decoder.muted).toBeTrue()
  expect(decoder.currentTime).toBe(4)
  video.pause()
  decoder.dispatchEvent(new Event("pause"))
  expect(video.paused).toBeTrue()
  expect(decoder.frames.size).toBe(0)
  expect(f.decoders).toHaveLength(1)
  f.host.dispose()
})

test("page visibility suspends presentation and resumes the same playing decoder without accepting stale callbacks", async () => {
  const page = new NativePage()
  const f = fixture(page)
  const video = f.document.createElement("video")
  const stream = {}
  video.srcObject = stream
  f.root.append(video)
  await video.play()
  const decoder = f.decoders[0]!
  decoder.ready()
  const resource = readVideoPlaybackState(video).resource
  const stale = [...decoder.frames.values()][0]!
  try {
    page.visibility("hidden")
    const stopped = f.frames
    expect(decoder.frames.size).toBe(0)
    expect(decoder.cancelled).toHaveLength(1)
    decoder.currentTime = 8
    decoder.dispatchEvent(new Event("timeupdate"))
    decoder.dispatchEvent(new Event("playing"))
    stale()
    expect(f.frames).toBe(stopped)
    expect(video.currentTime).toBe(8)
    expect(video.paused).toBeFalse()
    expect(decoder.frames.size).toBe(0)
    expect(decoder.pauses).toBe(0)
    expect(decoder.plays).toBe(1)

    page.visibility("visible")
    expect(f.frames).toBeGreaterThan(stopped)
    expect(decoder.frames.size).toBe(1)
    const resumed = f.frames
    stale()
    expect(f.frames).toBe(resumed)
    expect(decoder.frames.size).toBe(1)
    decoder.frame()
    expect(f.frames).toBeGreaterThan(resumed)
    expect(f.decoders).toHaveLength(1)
    expect(decoder.srcObject).toBe(stream)
    expect(readVideoPlaybackState(video).resource).toBe(resource)
    expect(f.published).toHaveLength(1)
    expect(f.released).toHaveLength(0)

    page.visibility("hidden")
    video.pause()
    page.visibility("visible")
    expect(video.paused).toBeTrue()
    expect(decoder.frames.size).toBe(0)
    expect(decoder.plays).toBe(1)
  } finally { f.host.dispose() }
  expect(page.visibilityListeners).toBe(0)
})

test("a page initially hidden keeps playback and semantic media events while withholding frame requests", async () => {
  const page = new NativePage()
  page.visibilityState = "hidden"
  const f = fixture(page)
  const video = f.document.createElement("video")
  video.src = "fixture.mp4"
  f.root.append(video)
  let metadata = 0
  video.addEventListener("loadedmetadata", () => metadata++)
  try {
    await video.play()
    const decoder = f.decoders[0]!
    decoder.ready()
    expect(metadata).toBe(1)
    expect(video.videoWidth).toBe(640)
    expect(video.paused).toBeFalse()
    expect(f.frames).toBe(0)
    expect(decoder.frames.size).toBe(0)
    page.visibility("visible")
    expect(f.frames).toBeGreaterThan(0)
    expect(decoder.frames.size).toBe(1)
    expect(f.decoders).toHaveLength(1)
  } finally { f.host.dispose() }
})

test("presented video set gates each decoder without changing playback, media events or source ownership", async () => {
  const f = fixture()
  const first = f.document.createElement("video")
  const second = f.document.createElement("video")
  first.srcObject = {}
  second.srcObject = {}
  f.root.append(first, second)
  await Promise.all([first.play(), second.play()])
  const a = f.decoders[0]!
  const b = f.decoders[1]!
  a.ready()
  b.ready()
  const stale = [...a.frames.values()][0]!
  let timeupdates = 0
  first.addEventListener("timeupdate", () => timeupdates++)
  try {
    f.host.setPresentedVideos([second])
    const stopped = f.frames
    expect(a.frames.size).toBe(0)
    expect(b.frames.size).toBe(1)
    a.currentTime = 12
    a.dispatchEvent(new Event("timeupdate"))
    expect(timeupdates).toBe(1)
    expect(first.currentTime).toBe(12)
    expect(first.paused).toBeFalse()
    expect(f.frames).toBe(stopped)
    expect(a.pauses).toBe(0)

    f.host.setPresentedVideos([first, second])
    expect(a.frames.size).toBe(1)
    expect(b.frames.size).toBe(1)
    const resumed = f.frames
    stale()
    expect(f.frames).toBe(resumed)
    expect(a.frames.size).toBe(1)
    f.host.setPresentedVideos([first, second])
    expect(f.frames).toBe(resumed)
    a.frame()
    expect(f.frames).toBeGreaterThan(resumed)
    f.host.setPresentedVideos([])
    expect(a.frames.size).toBe(0)
    expect(b.frames.size).toBe(0)
    expect(f.decoders).toHaveLength(2)
    expect(f.published).toHaveLength(2)
    expect(f.released).toHaveLength(0)
    expect(a.plays).toBe(1)
    expect(b.plays).toBe(1)
  } finally { f.host.dispose() }
})

test("new video waits for its first presented frame and both page and projection visibility must allow callbacks", async () => {
  const page = new NativePage()
  const f = fixture(page)
  f.host.setPresentedVideos([])
  const video = f.document.createElement("video")
  video.srcObject = {}
  f.root.append(video)
  try {
    await video.play()
    const decoder = f.decoders[0]!
    decoder.ready()
    expect(f.frames).toBe(0)
    expect(decoder.frames.size).toBe(0)
    expect(readVideoPlaybackState(video).resource).not.toBeNull()
    page.visibility("hidden")
    f.host.setPresentedVideos([video])
    expect(f.frames).toBe(0)
    expect(decoder.frames.size).toBe(0)
    page.visibility("visible")
    expect(decoder.frames.size).toBe(1)
    f.host.setPresentedVideos([])
    const stopped = f.frames
    page.visibility("hidden")
    page.visibility("visible")
    expect(decoder.frames.size).toBe(0)
    expect(f.frames).toBe(stopped)
  } finally { f.host.dispose() }
})

test("media-event fallback obeys page and presented visibility without a polling loop", async () => {
  const page = new NativePage()
  const f = fixture(page)
  const video = f.document.createElement("video")
  f.root.append(video)
  const decoder = f.decoders[0]!
  Object.defineProperty(decoder, "requestVideoFrameCallback", {value: undefined})
  try {
    await video.play()
    decoder.ready()
    const requested = f.frames
    decoder.dispatchEvent(new Event("timeupdate"))
    expect(f.frames).toBeGreaterThan(requested)
    page.visibility("hidden")
    const hidden = f.frames
    decoder.dispatchEvent(new Event("timeupdate"))
    expect(f.frames).toBe(hidden)
    page.visibility("visible")
    f.host.setPresentedVideos([])
    const offscreen = f.frames
    decoder.dispatchEvent(new Event("timeupdate"))
    expect(f.frames).toBe(offscreen)
    expect(decoder.frames.size).toBe(0)
  } finally { f.host.dispose() }
})

const font = {
  unitsPerEm: 1000,
  ascent: 800,
  descent: 200,
  mapCharToGlyph: () => 0,
  getGlyphOutline: () => ({points: new Float32Array(), onCurve: new Uint8Array(), contours: new Uint16Array()}),
  getHMetric: () => ({advanceWidth: 500, lsb: 0}),
} as unknown as TrueTypeFont

async function presentationFixture(kind: "canvas" | "plane" | "overlay") {
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "width: 200px; height: 100px; overflow: auto")
  const shell = document.createElement("main")
  document.append(shell)
  shell.append(root)
  const page = new NativePage()
  const rect = {left: 0, top: 0, width: 200, height: 200}
  const canvas = {
    ownerDocument: page,
    width: 200, height: 200, style: {touchAction: "auto", cursor: ""},
    getBoundingClientRect: () => rect,
    addEventListener() {}, removeEventListener() {},
    async requestFullscreen() {
      page.fullscreenElement = canvas
      page.dispatchEvent(new Event("fullscreenchange"))
    },
  } as unknown as HTMLCanvasElement
  const frames = new Map<number, () => void>()
  let nextFrame = 0
  const engine = {
    dispose() {}, setPixelRatio() {}, setSize() {}, invalidateGeometry() {},
    renderFrame() {}, renderComposition() {},
  } as unknown as Renderer
  const seams = {
    createEngineRenderer: () => engine,
    initializeEngineRenderer: async () => {},
    createSpace: () => new Space(),
    createViewPoint: () => new ViewPoint({position: {x: 0, y: -100, z: 0}}),
    createFixedViewPoint: () => new ViewPoint({position: {x: 0, y: -100, z: 0}}),
    createWorldViewPoint: () => new ViewPoint({position: {x: 0, y: -100, z: 0}}),
    createRaycaster: () => new Raycaster(),
    createNativeInputHost: () => ({nativeInput: {}, nativeTextArea: {}, setActiveRoot() {}, synchronize() {}, dispose() {}}) as unknown as DocumentNativeInputHost,
    createPlaneRuntime: createDocumentPlaneRuntime,
    createOverlayRuntime: createDocumentOverlayRuntime,
    createBackend: (options: ConstructorParameters<typeof RendererWebGpuBackend>[0]) => new RendererWebGpuBackend(options),
    createOverlay: (options: ConstructorParameters<typeof RendererWebGpuScreenOverlay>[0]) => new RendererWebGpuScreenOverlay(options),
    createDocumentRenderer,
    createInteraction: createDocumentInteractionController,
    createResizeObserver: () => ({observe() {}, disconnect() {}}),
    readCanvasRect: () => rect,
    devicePixelRatio: () => 1,
    requestFrame(callback: () => void) {
      const id = ++nextFrame
      frames.set(id, callback)
      return id
    },
    cancelFrame(handle: unknown) { frames.delete(handle as number) },
    setTimer: () => 1,
    clearTimer() {},
    now: () => 0,
  }
  const spaceRuntime = kind === "canvas" ? null : await createDocumentSpaceRuntimeWithSeams({canvas, document, font, styleSheets: []}, seams)
  const runtime = spaceRuntime ?? await createDocumentCanvasRuntimeWithSeams({canvas, document, root, font, styleSheets: []}, seams)
  if (kind === "plane") spaceRuntime!.addPlane({root, viewport: {width: 200, height: 200}, worldUnitsPerPixel: 1})
  if (kind === "overlay") spaceRuntime!.addOverlay({root})
  const settle = () => {
    for (let count = 0; frames.size > 0; count++) {
      if (count > 8) throw new Error("Presentation did not settle without video callbacks")
      const [id, callback] = frames.entries().next().value!
      frames.delete(id)
      callback()
    }
  }
  return {document, root, page, runtime, spaceRuntime, frames, settle}
}

test.each(["canvas", "plane", "overlay"] as const)("%s: ordinary CSS, hidden and scroll frames suspend and restore video presentation", async kind => {
  const f = await presentationFixture(kind)
  const video = f.document.createElement("video")
  const style = "display: block; width: 40px; height: 40px"
  video.setAttribute("style", style)
  video.srcObject = {}
  const tail = f.document.createElement("div")
  tail.setAttribute("style", "height: 300px")
  f.root.append(video, tail)
  try {
    await video.play()
    const decoder = f.page.decoders[0]!
    decoder.ready()
    f.settle()
    expect(decoder.frames.size).toBe(1)
    expect(f.frames.size).toBe(0)
    for (const hiddenStyle of ["display: none", "visibility: hidden", "opacity: 0"]) {
      video.setAttribute("style", `${style}; ${hiddenStyle}`)
      expect(f.frames.size).toBeGreaterThan(0)
      f.settle()
      expect(decoder.frames.size).toBe(0)
      video.setAttribute("style", style)
      f.settle()
      expect(decoder.frames.size).toBe(1)
    }
    video.hidden = true
    f.settle()
    expect(decoder.frames.size).toBe(0)
    video.hidden = false
    f.settle()
    expect(decoder.frames.size).toBe(1)
    f.root.scrollTop = 80
    expect(f.frames.size).toBeGreaterThan(0)
    f.settle()
    expect(decoder.frames.size).toBe(0)
    f.root.scrollTop = 20
    f.settle()
    expect(decoder.frames.size).toBe(1)
    expect(decoder.pauses).toBe(0)
    expect(decoder.plays).toBe(1)
    expect(f.page.decoders).toHaveLength(1)
    expect(video.paused).toBeFalse()
    expect(f.frames.size).toBe(0)
  } finally { f.runtime.dispose() }
})

test("Space fullscreen and projection visibility preserve decoders while choosing only presented videos", async () => {
  const f = await presentationFixture("plane")
  const runtime = f.spaceRuntime!
  const first = f.document.createElement("video")
  first.srcObject = {}
  first.setAttribute("style", "display: block; width: 40px; height: 40px")
  f.root.append(first)
  const overlayRoot = f.document.createElement("div")
  f.root.parentNode!.appendChild(overlayRoot)
  const second = f.document.createElement("video")
  second.srcObject = {}
  second.setAttribute("style", "display: block; width: 40px; height: 40px")
  overlayRoot.append(second)
  const overlay = runtime.addOverlay({root: overlayRoot})
  try {
    await Promise.all([first.play(), second.play()])
    const a = f.page.decoders[0]!
    const b = f.page.decoders[1]!
    a.ready()
    b.ready()
    f.settle()
    expect([a.frames.size, b.frames.size]).toEqual([1, 1])
    await first.requestFullscreen()
    f.settle()
    expect([a.frames.size, b.frames.size]).toEqual([1, 0])
    await f.document.exitFullscreen()
    f.settle()
    expect([a.frames.size, b.frames.size]).toEqual([1, 1])
    runtime.updatePlane(f.root, {transform: {visible: false}})
    f.settle()
    expect([a.frames.size, b.frames.size]).toEqual([0, 1])
    runtime.updatePlane(f.root, {transform: {visible: true}})
    overlay.overlay.visible = false
    f.settle()
    expect([a.frames.size, b.frames.size]).toEqual([1, 0])
    overlay.overlay.visible = true
    overlay.overlay.content.visible = false
    runtime.requestRender()
    f.settle()
    expect(b.frames.size).toBe(0)
    overlay.overlay.content.visible = true
    runtime.requestRender()
    f.settle()
    expect(b.frames.size).toBe(1)
    f.document.transaction(() => overlayRoot.append(first))
    f.settle()
    expect([a.frames.size, b.frames.size]).toEqual([1, 1])
    expect(f.page.decoders).toHaveLength(2)
    expect([a.pauses, b.pauses]).toEqual([0, 0])
    expect(f.frames.size).toBe(0)
  } finally { f.runtime.dispose() }
})

test("paint visibility uses current transformed clip owners and conservatively keeps uncertain geometry", () => {
  const document = createDocument()
  const root = document.createElement("div")
  const video = document.createElement("video")
  document.append(root)
  root.append(video)
  const transform = {scaleX: 1, scaleY: 1, translateX: 0, translateY: 0}
  const radius = {x: 0, y: 0}
  const clip = {x: 0, y: 0, width: 20, height: 20, clipX: true, clipY: true, transform, presentationOwner: root,
    radii: {topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius},
  }
  const image: ImageDisplayItem = {kind: "image", key: "video", node: video, src: "video", x: 40, y: 40, width: 20, height: 20,
    opacity: 1, fit: "contain", transform, clips: [clip],
  }
  const frame: RenderFrame = {document, root, revision: 1, viewport: {width: 100, height: 100}, displayList: [image],
    boxes: [], boxByNode: new Map(), hits: new Map(), scrolls: new Map(),
  }
  expect(readPresentedVideos([frame]).has(video)).toBeFalse()
  const moved = {...frame, presentationTransforms: new Map([[root, {...transform, translateX: 40, translateY: 40}]])}
  expect(readPresentedVideos([moved]).has(video)).toBeTrue()
  expect(readPresentedVideos([{...frame, displayList: [{...image, clips: [{...clip, clipX: false, clipY: false}]}]}]).has(video)).toBeTrue()
  expect(readPresentedVideos([{...frame, displayList: [{...image, clips: [], transform: {...transform, scaleX: -1, translateX: 100}}]}]).has(video)).toBeTrue()
  expect(readPresentedVideos([{...frame, displayList: [{...image, clips: [], transform: {...transform, translateX: 100}}]}]).has(video)).toBeFalse()
  expect(readPresentedVideos([{...frame, displayList: [{...image, transform: {...transform, translateX: Number.NaN}}]}]).has(video)).toBeTrue()
})

test.each(["plane", "overlay"] as const)("%s: metadata запрашивает пересчёт существующей проекции и освобождается вместе с ней", kind => {
  const document = createDocument()
  const root = document.createElement("div")
  const video = document.createElement("video")
  document.append(root)
  root.append(video)
  let requested = 0
  const options = {
    document, root, font, styleSheets: [], viewport: {width: 800, height: 600},
    requestFrame() { requested++ }, requestPresentation() {}, invalidateGeometry() {},
  }
  const runtime = kind === "plane" ? createDocumentPlaneRuntime({...options, worldUnitsPerPixel: 1}) : createDocumentOverlayRuntime(options)
  try {
    const initial = requested
    publishVideoPlaybackState(video, {...readVideoPlaybackState(video), videoWidth: 640, videoHeight: 480, resource: "metafor:video/projection"})
    expect(requested).toBeGreaterThan(initial)
    expect(runtime.flush().boxByNode.get(video)).toMatchObject({width: 640, height: 480})
    runtime.dispose()
    const stopped = requested
    publishVideoPlaybackState(video, {...readVideoPlaybackState(video), videoWidth: 1280, videoHeight: 720})
    expect(requested).toBe(stopped)
  } finally { runtime.dispose() }
})
