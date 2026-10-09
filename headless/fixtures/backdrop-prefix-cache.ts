import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {Color, Mesh, MeshBasicMaterial, PlaneGeometry, Space, TrueTypeFont, ViewPoint} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Renderer, RendererWebGpuBackend, RendererWebGpuDisplayPlane} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas, type CapturedFrame} from "../native-canvas.ts"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics.ts"

/** Считаем реальные GPU filter passes отдельно для каждого native устройства. */
const passCounts = new WeakMap<GPUDevice, {
  blur: number
  total: number
}>()
const gpu = createGPUInstance()
const requestAdapter = gpu.requestAdapter.bind(gpu)
gpu.requestAdapter = async options => {
  const adapter = await requestAdapter(options)
  if (!adapter) {
    return null
  }
  const requestDevice = adapter.requestDevice.bind(adapter)
  adapter.requestDevice = async descriptor => {
    const device = await requestDevice(descriptor)
    installShaderCompilationDiagnostics(device)
    const counts = {blur: 0, total: 0}
    passCounts.set(device, counts)
    const create = device.createCommandEncoder.bind(device)
    device.createCommandEncoder = descriptor => {
      const encoder = create(descriptor)
      const begin = encoder.beginRenderPass.bind(encoder)
      encoder.beginRenderPass = descriptor => {
        counts.total++
        if (descriptor.label === "backdrop-blur") {
          counts.blur++
        }
        return begin(descriptor)
      }
      return encoder
    }
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors)
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})

const width = 320
const height = 240
let logical = {width, height}
const canvas = new NativeGpuCanvas(width, height)
const renderer = new Renderer()
const document = createDocument()
const root = document.createElement("div")
const rootStyle = () => `position:relative;width:${logical.width}px;height:${logical.height}px`
root.setAttribute("style", rootStyle())
document.append(root)
const panelStyles = [
  "position:absolute;left:24px;top:24px;width:184px;height:156px;overflow:hidden;border-radius:12px;backdrop-filter:blur(6px);background:rgba(255,255,255,.12)",
  "position:absolute;left:92px;top:54px;width:180px;height:150px;overflow:hidden;border-radius:14px;backdrop-filter:blur(8px);background:rgba(255,255,255,.08)",
  "position:absolute;left:160px;top:94px;width:140px;height:126px;overflow:hidden;border-radius:16px;backdrop-filter:blur(4px)",
] as const
const panels = panelStyles.map((style, index) => {
  const panel = document.createElement("div")
  panel.setAttribute("style", style)
  const title = document.createElement("div")
  title.setAttribute("style", `margin:8px 12px;width:${index === 2 ? 116 : 156}px;height:30px;color:white;font-size:20px;line-height:24px`)
  title.textContent = ["Alpha", "Beta", "Gamma"][index]!
  panel.append(title)
  root.append(panel)
  return {panel, title}
})
const streamShape = document.createElement("div")
streamShape.setAttribute("style", "position:absolute;left:274px;top:8px;width:24px;height:24px;background:red;border-radius:6px")
root.append(streamShape)

const font = new TrueTypeFont(await Bun.file(new URL(import.meta.resolve("@zavx0z/immersive-engine/fonts/inter-regular.ttf"))).arrayBuffer())
const backend = new RendererWebGpuBackend({
  font,
  requestPresentation() {
  },
  invalidateGeometry: geometry => renderer.invalidateGeometry(geometry),
})
const layout = createDocumentRenderer({document, root, viewport: logical, textMeasurer: backend.textMeasurer!})
const space = new Space()
space.background = new Color(0x000000)
const view = new ViewPoint({position: {x: 0, y: -2000, z: 0}, target: {x: 0, y: 0, z: 0},
  viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
const units = () => 4000 * Math.tan(view.fov / 2) / logical.height
const display = new RendererWebGpuDisplayPlane({content: backend.root, viewport: logical,
  worldUnitsPerPixel: units(), rasterSize: {width, height}})
display.rotation.x = Math.PI / 2
space.add(display)
const world = Array.from({length: 10}, (_, index) => {
  const factor = 1.05
  const mesh = new Mesh(new PlaneGeometry({width: 32 * units() * factor, height: 300 * units() * factor}),
    new MeshBasicMaterial({color: index % 2 ? 0xffffff : 0x000000}))
  mesh.rotation.x = Math.PI / 2
  mesh.position.set((index * 32 + 16 - logical.width / 2) * units() * factor, 100, 0)
  space.add(mesh)
  return mesh
})
const foreground = new Mesh(new PlaneGeometry({width: 20 * units() * .95, height: 32 * units() * .95}), new MeshBasicMaterial({color: 0x0000ff}))
foreground.rotation.x = Math.PI / 2
foreground.position.set((66 - logical.width / 2) * units() * .95, -100, (logical.height / 2 - 120) * units() * .95)
space.add(foreground)

const summarize = (frame: CapturedFrame) => {
  const histogram = Array.from({length: 16}, () => 0)
  for (let offset = 0; offset < frame.rgba.length; offset += 4) {
    const gray = (frame.rgba[offset]! + frame.rgba[offset + 1]! + frame.rgba[offset + 2]!) / 3
    histogram[Math.min(15, Math.floor(gray / 16))]!++
  }
  const pixel = (x: number, y: number) => {
    const offset = (y * width + x) * 4
    return [...frame.rgba.slice(offset, offset + 4)]
  }
  return {hash: new Bun.CryptoHasher("sha256").update(frame.rgba).digest("hex"), histogram,
    blue: pixel(66, 120), halo: [48, 50, 52].map(x => pixel(x, 120))}
}

type Result = ReturnType<typeof summarize> & {
  name: string
  blurPasses: number
  totalPasses: number
  freshBlurPasses: number
  maxDifference: number
  differingChannels: number
  freshHistogram: number[]
  freshHash: string
  textRecords: string[]
  stableForeground: boolean
}
const results: Result[] = []
let stableForeground = true

/** Каждый oracle владеет новым Renderer, Canvas и GPUDevice, сохраняя тот же scene. */
const fresh = async () => {
  const canvas = new NativeGpuCanvas(width, height)
  const renderer = new Renderer()
  try {
    await renderer.init(canvas.asHtmlCanvas())
    const device = canvas.getContext("webgpu")!.getConfiguration()!.device
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint: view})
    const error = await device.popErrorScope()
    if (error) {
      throw new Error(`fresh oracle: ${error.message}`)
    }
    return {frame: await canvas.capture(), blurPasses: passCounts.get(device)!.blur}
  } finally {
    renderer.dispose()
    canvas.dispose()
  }
}

try {
  await renderer.init(canvas.asHtmlCanvas())
  const device = canvas.getContext("webgpu")!.getConfiguration()!.device
  const draw = async (name: string) => {
    const layoutFrame = layout.flush()
    backend.applyFrame(layoutFrame)
    const counts = passCounts.get(device)!
    counts.blur = 0
    counts.total = 0
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint: view})
    const error = await device.popErrorScope()
    if (error) {
      throw new Error(`${name}: ${error.message}`)
    }
    const frame = await canvas.capture()
    const {blur: blurPasses, total: totalPasses} = counts
    const oracle = await fresh()
    let maxDifference = 0
    let differingChannels = 0
    for (let index = 0; index < frame.rgba.length; index++) {
      const difference = Math.abs(frame.rgba[index]! - oracle.frame.rgba[index]!)
      maxDifference = Math.max(maxDifference, difference)
      if (difference > 0) {
        differingChannels++
      }
    }
    const freshSummary = summarize(oracle.frame)
    results.push({...summarize(frame), name, blurPasses, totalPasses,
      freshBlurPasses: oracle.blurPasses, maxDifference, differingChannels,
      freshHistogram: freshSummary.histogram, freshHash: freshSummary.hash,
      textRecords: layoutFrame.displayList.flatMap(item => item.kind === "text" ? [item.text] : []), stableForeground})
  }
  await draw("first")
  await draw("unchanged")
  panels[2]!.title.textContent = "Gamma running"
  await draw("last-text")
  streamShape.setAttribute("style", "position:absolute;left:266px;top:8px;width:32px;height:24px;background:lime;border-radius:6px;opacity:.5")
  await draw("last-shape")
  panels[0]!.title.textContent = "Alpha changed"
  await draw("earlier-text")
  panels[1]!.title.textContent = "Beta changed"
  await draw("middle-text")
  world[1]!.position.x += 8 * units()
  await draw("world")
  panels[1]!.panel.setAttribute("style", `${panelStyles[1]};backdrop-filter:blur(12px)`)
  await draw("sigma")
  panels[0]!.panel.setAttribute("style", `${panelStyles[0]};border-radius:40px`)
  await draw("clip")
  stableForeground = false
  view.position.x += 12 * units()
  view.update()
  await draw("camera")
  logical = {width: 352, height: 264}
  layout.resize(logical)
  root.setAttribute("style", rootStyle())
  display.configure(logical, units())
  display.setRasterSize({width: 352, height: 264})
  await draw("resize")
  await draw("resize-repeat")
  console.log(JSON.stringify({width, height, deviceFeatures: [...device.features], results}))
} finally {
  layout.dispose()
  backend.dispose()
  renderer.dispose()
  canvas.dispose()
  gpu.destroy()
}
