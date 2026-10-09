import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {Color, DirectionalLight, GlassMaterial, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {Renderer, RendererWebGpuBackend, RendererWebGpuDisplayPlane, RendererWebGpuScreenOverlay} from "@zavx0z/immersive-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {NativeGpuCanvas} from "../native-canvas"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics"

/** Изолированный настоящий GPU: production shader, depth, composite и HUD. */
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
const width = 200, height = 100
const canvas = new NativeGpuCanvas(width, height)
const renderer = new Renderer()
const space = new Space()
const viewPoint = new ViewPoint({position: {x: 0, y: -2000, z: 0}, target: {x: 0, y: 0, z: 0},
  viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
const plane = (material: GlassMaterial | MeshBasicMaterial, y: number, size = 1500) => {
  const mesh = new Mesh(new PlaneGeometry({width: size, height: size}), material)
  mesh.position.y = y
  mesh.rotation.x = Math.PI / 2
  return mesh
}
const first = plane(new GlassMaterial({tintColor: new Color(.8, .5, .25, .4), ior: 1}), -100)
const second = plane(new GlassMaterial({tintColor: new Color(.5, .7, .9, .3), ior: 1}), 100)
const foreground = plane(new MeshBasicMaterial({color: 0xff0000}), -300, 800)
const light = new DirectionalLight(0xffffff, 1)
light.position.set(0, -2000, 0)

const document = createDocument()
const hud = document.createElement("div")
hud.setAttribute("style", "width: 200px; height: 100px")
document.append(hud)
const button = document.createElement("button")
button.setAttribute("style", "position: absolute; left: 16px; top: 16px; width: 48px; height: 24px; padding: 0; border: none; background: lime")
hud.append(button)
const layout = createDocumentRenderer({document, root: hud, viewport: {width, height}})
const backend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
const overlay = new RendererWebGpuScreenOverlay({content: backend.root, viewport: {width, height}})
const results: Record<string, {center: number[], hud: number[]}> = {}
try {
  await renderer.init(canvas.asHtmlCanvas())
  const device = canvas.getContext("webgpu")!.getConfiguration()!.device
  backend.applyFrame(layout.flush())
  const render = async (name: string, withHud = false) => {
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint, ...(withHud ? {overlays: [overlay]} : {})})
    const error = await device.popErrorScope()
    if (error !== null) throw new Error(`${name}: ${error.message}`)
    const frame = await canvas.capture()
    const pixel = (x: number, y: number) => [...frame.rgba.slice((y * width + x) * 4, (y * width + x + 1) * 4)]
    results[name] = {center: pixel(100, 50), hud: pixel(30, 25)}
  }
  space.background = new Color(1, 1, 1)
  await render("white")
  space.add(first)
  await render("one")
  space.add(second)
  await render("two")
  space.remove(first)
  space.add(first)
  await render("reordered")
  space.background = new Color(0, 0, 0)
  await render("unlitBlack")
  space.background = new Color(1, 1, 1)
  space.add(foreground)
  await render("opaqueAndHud", true)
  space.remove(foreground)
  space.remove(second)
  const material = first.material as GlassMaterial
  material.tintColor = new Color(1, 1, 1, 1)
  material.thickness = 0
  first.rotation.z = Math.PI / 3
  space.add(light)
  await render("matchedIor")
  material.ior = 1.5
  first.rotation.z = 0
  space.background = new Color(0, 0, 0)
  await render("litBlack")
  material.tintColor.a = 0
  space.background = new Color(1, 1, 1)
  await render("disabled")
  material.tintColor.a = 1
  await render("reenabled")
  await render("repeated")
  space.remove(first)
  space.remove(light)
  space.background = new Color(0, 0, 0)
  const content = new Object3D()
  const backdrop = new Mesh(new PlaneGeometry({width: 200, height: 100}), new MeshBasicMaterial({color: 0xffffff}))
  backdrop.position.set(100, -50, 0)
  content.add(backdrop)
  const display = new RendererWebGpuDisplayPlane({content, viewport: {width, height}, worldUnitsPerPixel: 5, rasterSize: {width: 8, height: 4}})
  display.rotation.x = Math.PI / 2
  space.add(display)
  await render("rasterWhite")
  if (display.rasterSurface === null) throw new Error("Fixture не выбрала raster Display")
  const rasterGlass = new Mesh(new PlaneGeometry({width: 200, height: 100}), new GlassMaterial({tintColor: new Color(.8, .5, .25, .4), ior: 1}))
  rasterGlass.position.set(100, -50, 1)
  content.add(rasterGlass)
  await render("rasterGlass", true)
  await render("rasterRepeated", true)
  display.setRasterSize({width: 16, height: 8})
  await render("rasterResized", true)
  space.remove(display)
  renderer.releaseDisplay(display)
  await render("releasedDisplay")
  console.log(JSON.stringify(results))
} finally {
  layout.dispose()
  backend.dispose()
  renderer.dispose()
  canvas.dispose()
  gpu.destroy()
}
