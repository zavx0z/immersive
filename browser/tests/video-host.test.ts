import {expect, test} from "bun:test"
import {createDocument, readVideoPlaybackState, publishVideoPlaybackState} from "../../dom/src/index.ts"
import {createDocumentRenderer} from "../../renderer/html/src/index.ts"
import {createDocumentVideoHost} from "../src/video-host.ts"
import {createDocumentPlaneRuntime} from "../src/plane-runtime.ts"
import {createDocumentOverlayRuntime} from "../src/overlay-runtime.ts"
import type {TrueTypeFont} from "@zavx0z/immersive-engine"

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

function fixture() {
  const document = createDocument()
  const root = document.createElement("div")
  document.append(root)
  const decoders: Decoder[] = []
  const published: {src: string; decoder: Decoder; width: number; height: number}[] = []
  const released: string[] = []
  let frames = 0
  const host = createDocumentVideoHost({document, nativeDocument: undefined, requestFrame() { frames++ }}, {
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

const font = {
  unitsPerEm: 1000,
  ascent: 800,
  descent: 200,
  mapCharToGlyph: () => 0,
  getGlyphOutline: () => ({points: new Float32Array(), onCurve: new Uint8Array(), contours: new Uint16Array()}),
  getHMetric: () => ({advanceWidth: 500, lsb: 0}),
} as unknown as TrueTypeFont

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
