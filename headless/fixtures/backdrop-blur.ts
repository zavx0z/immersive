import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {Color, Space, ViewPoint, type Object3D} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Renderer, RendererWebGpuBackend, RendererWebGpuDisplayPlane, RendererWebGpuScreenOverlay} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas.ts"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics.ts"

/** Настоящие CSS/layout/display records и GPU pixels в отдельном native процессе. */
let adapterInfo: unknown = null
const gpu = createGPUInstance()
const requestAdapter = gpu.requestAdapter.bind(gpu)
gpu.requestAdapter = async options => {
  const adapter = await requestAdapter(options)
  if (adapter === null) return null
  adapterInfo = adapter.info
  const requestDevice = adapter.requestDevice.bind(adapter)
  adapter.requestDevice = async descriptor => {
    const device = await requestDevice(descriptor)
    installShaderCompilationDiagnostics(device)
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors)
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})

const coordinates = {
  insideWhite: [76, 75], insideBlack: [83, 75],
  outsideWhite: [76, 8], outsideBlack: [83, 8],
  foreground: [92, 42], foregroundRight: [108, 42], foregroundOutside: [84, 42],
  corner: [42, 22], overlap: [84, 42], released: [100, 60],
} as const

async function acceptance(mode: "hud" | "raster" | "direct") {
  const width = 600, height = 360
  let logical = {width: 200, height: 120}
  const canvas = new NativeGpuCanvas(width, height)
  const renderer = new Renderer()
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "position:relative;width:200px;height:120px;background:black")
  document.append(root)
  for (let index = 0; index < 5; index++) {
    const stripe = document.createElement("div")
    stripe.setAttribute("style", `position:absolute;left:${index * 40}px;top:0;width:40px;height:120px;background:${index % 2 ? "white" : "black"}`)
    root.append(stripe)
  }
  const panel = document.createElement("div")
  const panelStyle = "position:absolute;left:40px;top:20px;width:120px;height:80px;border-radius:20px;background:transparent"
  panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(0px)`)
  root.append(panel)
  const child = document.createElement("div")
  child.setAttribute("style", "position:absolute;left:48px;top:12px;width:24px;height:20px;background:red")
  panel.append(child)
  const sibling = document.createElement("div")
  const siblingStyle = "position:absolute;left:70px;top:24px;width:80px;height:60px;border-radius:10px;background:transparent"
  sibling.setAttribute("style", `${siblingStyle};display:none`)
  root.append(sibling)
  const layout = createDocumentRenderer({document, root, viewport: logical})
  const backend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
  const space = new Space()
  space.background = new Color(0, 0, 0)
  const viewPoint = new ViewPoint({position: {x: 0, y: -2000, z: 0}, target: {x: 0, y: 0, z: 0},
    viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
  const units = () => 4000 * Math.tan(viewPoint.fov / 2) / logical.height
  const overlay = mode === "hud" ? new RendererWebGpuScreenOverlay({content: backend.root, viewport: logical}) : null
  const display = mode !== "hud" ? new RendererWebGpuDisplayPlane({content: backend.root, viewport: logical,
    worldUnitsPerPixel: units(), rasterSize: mode === "direct" ? {width: 600, height: 360} : logical}) : null
  if (display !== null) {
    display.rotation.x = Math.PI / 2
    space.add(display)
  }
  let presenting = true
  const frames: Record<string, Record<string, number[]>> = {}
  const marker = () => backend.root.children.find(node => node.name.endsWith(":backdrop"))
  const markerCount = () => backend.root.children.filter(node => node.name.endsWith(":backdrop")).length
  let disposedMarker: Object3D | undefined
  try {
    await renderer.init(canvas.asHtmlCanvas())
    const device = canvas.getContext("webgpu")!.getConfiguration()!.device
    const render = async (name: string) => {
      backend.applyFrame(layout.flush())
      device.pushErrorScope("validation")
      renderer.renderComposition({space, viewPoint, overlays: presenting && overlay !== null ? [overlay] : []})
      const validation = await device.popErrorScope()
      if (validation !== null) throw new Error(`${mode}/${name}: ${validation.message}`)
      const frame = await canvas.capture()
      frames[name] = Object.fromEntries(Object.entries(coordinates).map(([key, [x, y]]) => {
        const physicalX = Math.floor((x + .5) * width / logical.width)
        const physicalY = Math.floor((y + .5) * height / logical.height)
        const offset = (physicalY * width + physicalX) * 4
        return [key, [...frame.rgba.slice(offset, offset + 4)]]
      }))
    }
    await render("zero")
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(6px)`)
    await render("blurred")
    const retained = marker()
    if (retained === undefined) throw new Error("CSS blur не создал backend marker")
    const rasterSelected = display === null || (display.rasterSurface !== null) === (mode === "raster")
    panel.setAttribute("style", `${panelStyle};backdrop-filter:none`)
    await render("none")
    const noneCleared = markerCount() === 0 && !backend.root.children.includes(retained)
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(6px);opacity:0`)
    await render("opacityZero")
    panel.setAttribute("style", `${panelStyle};display:none`)
    await render("hidden")
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(6px)`)
    sibling.setAttribute("style", `${siblingStyle};backdrop-filter:blur(0px)`)
    await render("overlapZero")
    sibling.setAttribute("style", `${siblingStyle};backdrop-filter:blur(6px)`)
    await render("overlapBlurred")
    sibling.setAttribute("style", `${siblingStyle};display:none`)
    await render("beforeMove")
    const beforeMove = marker()
    panel.setAttribute("style", `${panelStyle};left:44px;backdrop-filter:blur(6px)`)
    await render("moved")
    const moveReused = marker() === beforeMove
    panel.setAttribute("style", `${panelStyle};left:44px;backdrop-filter:blur(0px)`)
    await render("movedZero")
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(6px)`)
    logical = {width: 220, height: 132}
    layout.resize(logical)
    overlay?.resize(logical)
    display?.configure(logical, units())
    display?.setRasterSize(mode === "direct" ? {width: 660, height: 396} : logical)
    await render("resized")
    const resizedRasterSelected = display === null || (display.rasterSurface !== null) === (mode === "raster")
    if (mode === "hud") {
      child.setAttribute("hidden", "")
      root.setAttribute("style", "position:relative;width:220px;height:132px;background:transparent")
      Array.from(root.children).slice(0, 5).forEach((stripe, index) => {
        stripe.setAttribute("style", `position:absolute;left:${index * 40}px;top:0;width:40px;height:132px;background:${index % 2 ? "white" : "transparent"}`)
      })
      space.background = new Color(0, 0, 0, 0)
      await render("alphaBlur")
      space.background = new Color(0, 0, 0)
    }
    disposedMarker = marker()
    backend.dispose()
    const disposeCleared = disposedMarker !== undefined && backend.root.children.length === 0
    if (display !== null) {
      space.remove(display)
      renderer.releaseDisplay(display)
    }
    presenting = false
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint, overlays: []})
    const validation = await device.popErrorScope()
    if (validation !== null) throw new Error(`${mode}/released: ${validation.message}`)
    const released = await canvas.capture()
    const offset = ((height / 2) * width + width / 2) * 4
    return {frames, rasterSelected, resizedRasterSelected, noneCleared, moveReused, disposeCleared,
      released: [...released.rgba.slice(offset, offset + 4)]}
  } finally {
    layout.dispose()
    backend.dispose()
    renderer.dispose()
    canvas.dispose()
  }
}

/** Необязательный короткий workload: CPU render + queue completion, без порога FPS. */
async function benchmark(width: number, height: number) {
  const canvas = new NativeGpuCanvas(width, height)
  const renderer = new Renderer()
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", `position:relative;width:${width}px;height:${height}px;background:black`)
  document.append(root)
  for (let left = 0; left < width; left += 40) {
    const stripe = document.createElement("div")
    stripe.setAttribute("style", `position:absolute;left:${left}px;top:0;width:20px;height:${height}px;background:white`)
    root.append(stripe)
  }
  const panels = Array.from({length: 3}, (_, index) => {
    const panel = document.createElement("div")
    panel.setAttribute("style", `position:absolute;left:${Math.floor(width * (.1 + index * .2))}px;top:${Math.floor(height * (.1 + index * .15))}px;width:${Math.floor(width * .5)}px;height:${Math.floor(height * .5)}px;border-radius:20px;backdrop-filter:blur(8px)`)
    root.append(panel)
    return panel
  })
  const panelStyles = panels.map(panel => panel.getAttribute("style"))
  const viewport = {width, height}
  const layout = createDocumentRenderer({document, root, viewport})
  const backend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
  const overlay = new RendererWebGpuScreenOverlay({content: backend.root, viewport})
  const space = new Space()
  const viewPoint = new ViewPoint({position: {x: 0, y: -2000, z: 0}, target: {x: 0, y: 0, z: 0},
    viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
  let fence: GPUBuffer | undefined
  try {
    await renderer.init(canvas.asHtmlCanvas())
    const context = canvas.getContext("webgpu")!
    const device = context.getConfiguration()!.device
    fence = device.createBuffer({size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ})
    const samples: Record<string, number[]> = {}
    for (const [name, count] of [["noBlur", 0], ["onePanel", 1], ["threePanels", 3]] as const) {
      panels.forEach((panel, index) => {panel.setAttribute("style", `${panelStyles[index]};display:${index < count ? "block" : "none"}`)})
      backend.applyFrame(layout.flush())
      samples[name] = []
      device.pushErrorScope("validation")
      for (let frame = 0; frame < 24; frame++) {
        const started = performance.now()
        renderer.renderComposition({space, viewPoint, overlays: [overlay]})
        const encoder = device.createCommandEncoder()
        encoder.copyTextureToBuffer({texture: context.getCurrentTexture()}, {buffer: fence, bytesPerRow: 256, rowsPerImage: 1}, {width: 1, height: 1})
        device.queue.submit([encoder.finish()])
        await fence.mapAsync(GPUMapMode.READ)
        fence.unmap()
        if (frame >= 8) samples[name]!.push(performance.now() - started)
      }
      const validation = await device.popErrorScope()
      if (validation !== null) throw new Error(`${width}×${height}/${name}: ${validation.message}`)
    }
    return {width, height, metric: "renderComposition + 1px copy/map queue completion wall ms", warmupFrames: 8, samples}
  } finally {
    fence?.destroy()
    layout.dispose()
    backend.dispose()
    renderer.dispose()
    canvas.dispose()
  }
}

try {
  const result = Bun.argv[2] === "benchmark"
    ? {benchmark: [await benchmark(1280, 720), await benchmark(2730, 2176)]}
    : {hud: await acceptance("hud"), raster: await acceptance("raster"), direct: await acceptance("direct")}
  console.log(JSON.stringify(Bun.argv[2] === "benchmark" ? {...result, adapterInfo} : result))
} finally {gpu.destroy()}
