import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {Color, DirectionalLight, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Space, TrueTypeFont, ViewPoint} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Renderer, RendererWebGpuBackend, RendererWebGpuDisplayPlane, TextureLoader} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas.ts"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics.ts"
import {createImageBitmap, ImageBitmap} from "../image-bitmap.ts"
import {imageFromRgba} from "../image.ts"
import {installExternalImageCopy} from "../external-image.ts"

let passes = 0
const gpu = createGPUInstance()
const requestAdapter = gpu.requestAdapter.bind(gpu)
gpu.requestAdapter = async options => {
  const adapter = await requestAdapter(options)
  if (!adapter) {
    return null
  }
  const request = adapter.requestDevice.bind(adapter)
  adapter.requestDevice = async descriptor => {
    const device = await request(descriptor)
    installShaderCompilationDiagnostics(device)
    installExternalImageCopy(device)
    const create = device.createCommandEncoder.bind(device)
    device.createCommandEncoder = descriptor => {
      const encoder = create(descriptor)
      const begin = encoder.beginRenderPass.bind(encoder)
      encoder.beginRenderPass = descriptor => {
        passes++
        return begin(descriptor)
      }
      return encoder
    }
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors, {createImageBitmap, ImageBitmap})
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})

const width = 320
const height = 240
const canvas = new NativeGpuCanvas(width, height)
const renderer = new Renderer()
const document = createDocument()
const root = document.createElement("div")
root.setAttribute("style", `width:${width}px;height:${height}px;position:relative`)
document.append(root)
const panel = document.createElement("div")
const panelStyle = "position:absolute;left:20px;top:30px;width:260px;height:180px;overflow:hidden;border-radius:10px;backdrop-filter:blur(6px)"
panel.setAttribute("style", panelStyle)
root.append(panel)
const fill = document.createElement("div")
fill.setAttribute("style", "position:absolute;width:280px;height:190px;background:rgba(0,0,255,.2)")
panel.append(fill)
const title = document.createElement("div")
title.setAttribute("style", "height:30px;color:white;font-size:20px")
title.textContent = "Alpha"
panel.append(title)
const font = new TrueTypeFont(await Bun.file(new URL(import.meta.resolve("@zavx0z/immersive-engine/fonts/inter-regular.ttf"))).arrayBuffer())
const backend = new RendererWebGpuBackend({
  font,
  requestPresentation() {
  },
  invalidateGeometry: geometry => renderer.invalidateGeometry(geometry),
})
const layout = createDocumentRenderer({document, root, viewport: {width, height}, textMeasurer: backend.textMeasurer!})
const space = new Space()
space.background = new Color(0x000000)
const view = new ViewPoint({position: {x: 0, y: -2000, z: 0}, target: {x: 0, y: 0, z: 0}, viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
const units = 4000 * Math.tan(view.fov / 2) / height
const display = new RendererWebGpuDisplayPlane({content: backend.root, viewport: {width, height}, worldUnitsPerPixel: units, rasterSize: {width, height}})
display.rotation.x = Math.PI / 2
space.add(display)
const material = new MeshLambertMaterial({color: 0xffffff})
const world = new Mesh(new PlaneGeometry({width: width * units * 1.05, height: height * units * 1.05}), material)
world.rotation.x = Math.PI / 2
world.position.y = 100
space.add(world)
const stripe = new Mesh(new PlaneGeometry({width: 80 * units, height: height * units * 1.1}), new MeshBasicMaterial({color: 0xff0000}))
stripe.rotation.x = Math.PI / 2
stripe.position.set(-40 * units, 50, 0)
space.add(stripe)
const light = new DirectionalLight(0xffffff, 1)
light.position.set(0, -2000, 0)
space.add(light)
const results: {
  name: string
  passes: number
  hash: string
  pixel: number[]
}[] = []
try {
  await renderer.init(canvas.asHtmlCanvas())
  const device = canvas.getContext("webgpu")!.getConfiguration()!.device
  const draw = async (name: string) => {
    backend.applyFrame(layout.flush())
    passes = 0
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint: view})
    const error = await device.popErrorScope()
    if (error) {
      throw new Error(`${name}: ${error.message}`)
    }
    const frame = await canvas.capture()
    const pixel = (60 * width + 240) * 4
    results.push({name, passes, hash: new Bun.CryptoHasher("sha256").update(frame.rgba).digest("hex"), pixel: [...frame.rgba.slice(pixel, pixel + 4)]})
  }
  await draw("first")
  await draw("unchanged")
  material.color.setHex(0x88ccff)
  await draw("material")
  await draw("material-repeat")
  light.color.setHex(0xff4444)
  await draw("light")
  await draw("light-repeat")
  view.position.x = 80
  view.update()
  await draw("camera")
  await draw("camera-repeat")
  stripe.geometry.attributes.position!.array[0]! += 30 * units
  stripe.geometry.attributes.position!.addUpdateRange(0, 1)
  await draw("geometry")
  await draw("geometry-repeat")
  title.textContent = "Beta"
  await draw("text")
  await draw("text-repeat")
  panel.setAttribute("style", `${panelStyle};border-radius:60px`)
  await draw("clip")
  await draw("clip-repeat")
  panel.setAttribute("style", `${panelStyle};border-radius:60px;backdrop-filter:blur(12px)`)
  await draw("sigma")
  await draw("sigma-repeat")
  const stripeMaterial = stripe.material as MeshBasicMaterial
  stripe.material = [stripeMaterial]
  stripeMaterial.visible = false
  await draw("visibility")
  await draw("visibility-repeat")
  space.background = new Color(0x00ff00)
  await draw("background")
  await draw("background-repeat")
  const image = document.createElement("img")
  image.setAttribute("src", "replay:test-bitmap")
  image.setAttribute("style", "position:absolute;left:220px;top:40px;width:60px;height:60px")
  root.append(image)
  const bitmap = async (rgba: number[]) => {
    const bytes = await imageFromRgba(new Uint8Array([...rgba, ...rgba, ...rgba, ...rgba]), 2, 2).png().buffer()
    return createImageBitmap(new Blob([new Uint8Array(bytes).buffer]))
  }
  TextureLoader.replaceBitmap("replay:test-bitmap", await bitmap([255, 0, 0, 255]))
  for (let index = 0; index < 3; index++) {
    await draw(`image-warm-${index}`)
    await Bun.sleep(0)
  }
  await draw("image-repeat")
  const texture = TextureLoader.peek("replay:test-bitmap", device)!.texture
  TextureLoader.replaceBitmap("replay:test-bitmap", await bitmap([0, 255, 0, 255]))
  await Bun.sleep(0)
  await draw("image-replaced")
  const sameImageTexture = texture === TextureLoader.peek("replay:test-bitmap", device)!.texture
  await draw("image-replaced-repeat")
  renderer.invalidateGeometry(world.geometry)
  await draw("invalidated")
  await draw("invalidated-repeat")
  console.log(JSON.stringify({results, sameImageTexture}))
} finally {
  backend.dispose()
  layout.dispose()
  renderer.dispose()
  canvas.dispose()
  gpu.destroy()
}
