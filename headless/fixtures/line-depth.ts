import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {mkdir} from "node:fs/promises"
import {join} from "node:path"
import {BufferAttribute, BufferGeometry, Color, GlassMaterial, LineGlowMaterial, LineSegments, Mesh, MeshBasicMaterial, PlaneGeometry, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {Renderer} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics"

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

const width = 96, height = 96
const canvas = new NativeGpuCanvas(width, height)
const renderer = new Renderer()
const space = new Space()
space.background = new Color(1, 1, 1)
const viewPoint = new ViewPoint({position: {x: 0, y: -2000, z: 0}, target: {x: 0, y: 0, z: 0},
  viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
const segment = (y: number, vertical = false) => vertical
  ? [0, y, -700, 0, y, 700]
  : [-700, y, 0, 700, y, 0]
const line = (positions: readonly number[], color: number, opacity: number, vertexColors = true) => {
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3))
  if (vertexColors) geometry.setAttribute("color", new BufferAttribute(new Float32Array(positions.length).fill(1), 3))
  return new LineSegments(geometry, new LineGlowMaterial({color, opacity, visibilityMode: "scene",
    glowIntensity: 1, luminanceBoost: 1, distanceFade: 0, shimmerAmount: 0, silhouetteAmount: 0}))
}
const near = line(segment(-200), 0xff0000, .4)
const defaultColorNear = line(segment(-200), 0xff0000, .4, false)
const nearMaterial = near.material
if (!(nearMaterial instanceof LineGlowMaterial)) throw new Error("Ожидался материал ближнего ребра")
const far = line(segment(200), 0x00ff00, .75)
const crossingFar = line(segment(200, true), 0x00ff00, .75)
const forwardBatch = line([...segment(-200), ...segment(200)], 0xff0000, .4)
const reverseBatch = line([...segment(200), ...segment(-200)], 0xff0000, .4)
const glass = new Mesh(new PlaneGeometry({width: 1800, height: 1800}),
  new GlassMaterial({tintColor: new Color(.5, .7, .9, .3), ior: 1}))
glass.rotation.x = Math.PI / 2
const blocker = new Mesh(new PlaneGeometry({width: 1800, height: 1800}), new MeshBasicMaterial({color: 0x0000ff}))
blocker.rotation.x = Math.PI / 2
blocker.position.y = -400
const output = process.env.LINE_DEPTH_OUTPUT
const frames: Record<string, number[]> = {}

try {
  if (output) await mkdir(output, {recursive: true})
  await renderer.init(canvas.asHtmlCanvas())
  const device = canvas.getContext("webgpu")!.getConfiguration()!.device
  const render = async (name: string, objects: readonly (LineSegments | Mesh)[]) => {
    for (const child of [...space.children]) space.remove(child)
    for (const child of objects) space.add(child)
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint})
    const frame = await canvas.capture()
    const error = await device.popErrorScope()
    if (error !== null) throw new Error(`${name}: ${error.message}`)
    const patch: number[] = []
    for (let y = 44; y < 52; y++) {
      patch.push(...frame.rgba.slice((y * width + 44) * 4, (y * width + 52) * 4))
    }
    frames[name] = patch
    if (output) await Bun.write(join(output, `${name}.png`), frame.png)
  }
  await render("empty", [])
  await render("near", [near])
  await render("defaultColorNear", [defaultColorNear])
  await render("defaultColorNearFar", [defaultColorNear, far])
  await render("defaultColorNearFarAgain", [defaultColorNear, far])
  await render("far", [far])
  await render("nearFar", [near, far])
  await render("farNear", [far, near])
  await render("crossNearFar", [near, crossingFar])
  await render("crossFarNear", [crossingFar, near])
  await render("batchNearFar", [forwardBatch])
  await render("batchFarNear", [reverseBatch])
  await render("glass", [glass])
  await render("glassNear", [glass, near])
  await render("glassNearFar", [glass, near, far])
  glass.position.y = -400
  await render("frontGlass", [glass])
  await render("frontGlassNear", [glass, near])
  await render("frontGlassNearFar", [glass, near, far])
  glass.position.y = 0
  nearMaterial.opacity = 0
  await render("zeroNearFar", [near, far])
  await render("farZeroNear", [far, near])
  await render("zeroNearGlass", [near, glass])
  nearMaterial.opacity = .4
  nearMaterial.color.a = 0
  await render("zeroColorNearFar", [near, far])
  nearMaterial.color.a = 1
  await render("blocker", [blocker])
  await render("blockedLines", [far, near, blocker])
  console.log(JSON.stringify({width, height, frames}))
} finally {
  renderer.dispose()
  canvas.dispose()
  gpu.destroy()
}
