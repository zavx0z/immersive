import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {Mesh, MeshBasicMaterial, PlaneGeometry, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Renderer, RendererWebGpuBackend, RendererWebGpuScreenOverlay, RendererWebGpuDisplayPlane} from "@zavx0z/immersive-webgpu"
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
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors)
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})
const canvas = new NativeGpuCanvas(200, 100)
const renderer = new Renderer()
const document = createDocument()
const documentRoot = document.createElement("main")
document.append(documentRoot)
const hud = document.createElement("div")
hud.setAttribute("style", "width: 200px; height: 100px")
const button = document.createElement("button")
button.setAttribute("style", "position: absolute; left: 16px; top: 16px; width: 48px; height: 24px; padding: 0; border: none; background: lime")
hud.append(button)
documentRoot.append(hud)
const layout = createDocumentRenderer({document, root: hud, viewport: {width: 200, height: 100}})
const backend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
const overlay = new RendererWebGpuScreenOverlay({content: backend.root, viewport: {width: 200, height: 100}})
const secondHud = document.createElement("div")
secondHud.setAttribute("style", "width: 200px; height: 100px")
const secondButton = document.createElement("button")
secondButton.setAttribute("style", "position: absolute; left: 130px; top: 16px; width: 48px; height: 24px; padding: 0; border: none; background: yellow")
secondHud.append(secondButton)
documentRoot.append(secondHud)
const secondLayout = createDocumentRenderer({document, root: secondHud, viewport: {width: 200, height: 100}})
const secondBackend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
const secondOverlay = new RendererWebGpuScreenOverlay({content: secondBackend.root, viewport: {width: 200, height: 100}, distance: 1200})
const worldContent = document.createElement("div")
worldContent.setAttribute("style", "width: 400px; height: 400px; background: blue")
documentRoot.append(worldContent)
const worldLayout = createDocumentRenderer({document, root: worldContent, viewport: {width: 400, height: 400}})
const worldBackend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
const display = new RendererWebGpuDisplayPlane({content: worldBackend.root, viewport: {width: 400, height: 400},
  worldUnitsPerPixel: 5, rasterSize: {width: 2, height: 2}})
display.rotation.x = Math.PI / 2
const space = new Space()
const viewPoint = new ViewPoint({position: {x: 0, y: -20000, z: 0}, target: {x: 0, y: 0, z: 0},
  viewport: {left: 0, top: 0, width: 200, height: 100}, near: 0.1, far: 22000})
const plane = (color: number, y: number) => {
  const mesh = new Mesh(new PlaneGeometry({width: 2000, height: 2000}), new MeshBasicMaterial({color}))
  mesh.position.y = y
  mesh.rotation.x = Math.PI / 2
  space.add(mesh)
}
space.add(display)
plane(0xff0000, -19500)
const frames: {near: number; far: number; hudPixels: number[]; secondHud: number[]; center: number[]; raster: boolean}[] = []
try {
  await renderer.init(canvas.asHtmlCanvas())
  const device = canvas.getContext("webgpu")!.getConfiguration()!.device
  backend.applyFrame(layout.flush())
  secondBackend.applyFrame(secondLayout.flush())
  worldBackend.applyFrame(worldLayout.flush())
  for (const clip of [{near: 0.1, far: 22000}, {near: 10, far: 100}, {near: 10000, far: 22000}]) {
    viewPoint.near = clip.near
    viewPoint.far = clip.far
    viewPoint.updateProjectionMatrix()
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint, overlays: [overlay, secondOverlay]})
    const error = await device.popErrorScope()
    if (error !== null) throw new Error(error.message)
    const frame = await canvas.capture()
    const pixel = (x: number, y: number) => [...frame.rgba.slice((y * 200 + x) * 4, (y * 200 + x + 1) * 4)]
    const hudPixels: number[] = []
    for (let y = 20; y < 36; y++) for (let x = 20; x < 60; x++) hudPixels.push(...pixel(x, y))
    frames.push({...clip, hudPixels, secondHud: pixel(140, 24), center: pixel(100, 50), raster: display.rasterSurface !== null})
  }
  console.log(JSON.stringify(frames))
} finally {
  layout.dispose()
  backend.dispose()
  secondLayout.dispose()
  secondBackend.dispose()
  worldLayout.dispose()
  worldBackend.dispose()
  renderer.dispose()
  canvas.dispose()
  gpu.destroy()
}
