import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {Color, Mesh, MeshBasicMaterial, PlaneGeometry, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Renderer, RendererWebGpuBackend, RendererWebGpuDisplayPlane, RendererWebGpuScreenOverlay} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas.ts"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics.ts"

const gpu = createGPUInstance()
const requestAdapter = gpu.requestAdapter.bind(gpu)
gpu.requestAdapter = async options => {
  const adapter = await requestAdapter(options)
  if (adapter === null) return null
  const requestDevice = adapter.requestDevice.bind(adapter)
  adapter.requestDevice = async descriptor => {
    const device = await requestDevice(descriptor)
    installShaderCompilationDiagnostics(device)
    const createShaderModule = device.createShaderModule.bind(device)
    device.createShaderModule = descriptor => {
      const module = createShaderModule(descriptor)
      void module.getCompilationInfo().then(info => {
        for (const message of info.messages) console.error(`${descriptor.label}: ${message.message}`)
      })
      return module
    }
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors)
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})

const width = 256
const height = 192
const viewport = {width, height}
const probes = {center: [128, 96], body: [88, 68], foreground: [145, 96], hud: [128, 12]} as const

async function run(mode: "direct" | "raster" | "mixed" | "mixed-front") {
  const canvas = new NativeGpuCanvas(width, height)
  const renderer = new Renderer()
  const document = createDocument()
  const application = document.createElement("main")
  document.append(application)
  const space = new Space()
  space.background = new Color(0, 0, 0)
  const viewPoint = new ViewPoint({
    position: {x: 0, y: -1000, z: 0},
    target: {x: 0, y: 0, z: 0},
    viewport: {left: 0, top: 0, ...viewport},
    near: .1,
    far: 5000,
  })
  const units = 2000 * Math.tan(viewPoint.fov / 2) / height
  const projections: {layout: ReturnType<typeof createDocumentRenderer>, backend: RendererWebGpuBackend}[] = []
  const projection = (style: string, size: {width: number, height: number}) => {
    const root = document.createElement("div")
    root.setAttribute("style", style)
    application.append(root)
    const backend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
    const layout = createDocumentRenderer({document, root, viewport: size})
    projections.push({layout, backend})
    return {root, backend}
  }
  const front = projection("position:relative;width:160px;height:120px;background:lime", {width: 160, height: 120})
  const windowA = document.createElement("div")
  const windowB = document.createElement("div")
  const windowStyle = "position:absolute;left:50px;top:35px;width:60px;height:50px"
  windowA.setAttribute("style", `${windowStyle};background:yellow;z-index:1`)
  windowB.setAttribute("style", `${windowStyle};background:#ff00ff;z-index:2`)
  front.root.append(windowA, windowB)
  const rear = projection("width:200px;height:150px;background:red", {width: 200, height: 150})
  const plane = (backend: RendererWebGpuBackend, size: {width: number, height: number}, raster: boolean, y: number) => {
    const display = new RendererWebGpuDisplayPlane({
      content: backend.root,
      viewport: size,
      worldUnitsPerPixel: units,
      rasterSize: raster ? {width: Math.round(size.width / 4), height: Math.round(size.height / 4)} : {width: size.width * 100, height: size.height * 100},
    })
    display.rotation.x = Math.PI / 2
    display.position.y = y
    return display
  }
  const frontPlane = plane(front.backend, {width: 160, height: 120}, mode === "raster" || mode === "mixed-front", -80)
  const rearPlane = plane(rear.backend, {width: 200, height: 150}, mode === "raster" || mode === "mixed", 80)
  // Намеренно сначала ближний Display: DFS не совпадает с пространственным порядком.
  space.add(frontPlane)
  space.add(rearPlane)
  const hud = projection("position:relative;width:256px;height:192px", viewport)
  const badge = document.createElement("div")
  badge.setAttribute("style", "position:absolute;left:96px;top:0;width:64px;height:28px;background:#00ffff")
  hud.root.append(badge)
  const overlay = new RendererWebGpuScreenOverlay({content: hud.backend.root, viewport})
  const foreground = new Mesh(new PlaneGeometry({width: 16 * units, height: 24 * units}), new MeshBasicMaterial({color: 0x0000ff}))
  foreground.rotation.x = Math.PI / 2
  foreground.position.set(17 * units * .84, -160, 0)
  const frames: Record<string, Record<keyof typeof probes, number[]>> = {}
  const rasterized: Record<string, boolean[]> = {}
  try {
    await renderer.init(canvas.asHtmlCanvas())
    const device = canvas.getContext("webgpu")!.getConfiguration()!.device
    const draw = async (name: string) => {
      for (const {layout, backend} of projections) backend.applyFrame(layout.flush())
      device.pushErrorScope("validation")
      renderer.renderComposition({space, viewPoint, overlays: [overlay]})
      const error = await device.popErrorScope()
      if (error) throw new Error(`${mode}/${name}: ${error.message}`)
      const frame = await canvas.capture()
      frames[name] = Object.fromEntries(Object.entries(probes).map(([key, [x, y]]) => {
        const offset = (y * width + x) * 4
        return [key, [...frame.rgba.slice(offset, offset + 4)]]
      })) as Record<keyof typeof probes, number[]>
      rasterized[name] = [frontPlane.rasterSurface !== null, rearPlane.rasterSurface !== null]
      const directory = process.env.DISPLAY_OCCLUSION_EVIDENCE_DIR
      if (directory) await Bun.write(`${directory}/${mode}-${name}.png`, frame.png)
    }
    await draw("near-first")
    await draw("unchanged")
    space.remove(frontPlane)
    space.remove(rearPlane)
    space.add(rearPlane)
    space.add(frontPlane)
    await draw("far-first")
    front.root.setAttribute("style", "position:relative;width:160px;height:120px;background:rgba(0,255,0,.5)")
    await draw("translucent")
    front.root.setAttribute("style", "position:relative;width:160px;height:120px;background:lime")
    windowA.setAttribute("style", `${windowStyle};background:yellow;z-index:3`)
    await draw("window-raised")
    space.add(foreground)
    await draw("world-foreground")
    windowA.setAttribute("style", `${windowStyle};background:yellow;z-index:3;backdrop-filter:blur(4px)`)
    await draw("backdrop")
    space.remove(foreground)
    viewPoint.position.y = 1000
    viewPoint.update()
    await draw("camera-behind")
    viewPoint.position.y = -1000
    viewPoint.update()
    await draw("camera-return")
    return {mode, frames, rasterized}
  } finally {
    for (const {layout, backend} of projections) {
      layout.dispose()
      backend.dispose()
    }
    renderer.dispose()
    canvas.dispose()
  }
}

try {
  console.log(JSON.stringify({results: [await run("direct"), await run("raster"), await run("mixed"), await run("mixed-front")]}))
} finally {
  gpu.destroy()
}
