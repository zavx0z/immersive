import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {AnimationClip, AnimationMixer, BufferAttribute, BufferGeometry, Color, InstancedSkinnedMesh, KeyframeTrack, Matrix4, MeshLambertMaterial, Object3D, Skeleton, SkinnedMesh, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {Renderer} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics"

const gpu = createGPUInstance()
const requestAdapter = gpu.requestAdapter.bind(gpu)
const draws: number[][] = []
let passes = 0, created = 0, destroyed = 0
gpu.requestAdapter = async options => {
  const adapter = await requestAdapter(options)
  if (!adapter) return null
  const requestDevice = adapter.requestDevice.bind(adapter)
  adapter.requestDevice = async descriptor => {
    const device = await requestDevice(descriptor)
    installShaderCompilationDiagnostics(device)
    const createBuffer = device.createBuffer.bind(device)
    device.createBuffer = descriptor => {
      created++
      const buffer = createBuffer(descriptor)
      const destroy = buffer.destroy.bind(buffer)
      buffer.destroy = () => {destroyed++; destroy()}
      return buffer
    }
    const createBundle = device.createRenderBundleEncoder.bind(device)
    device.createRenderBundleEncoder = descriptor => {
      const encoder = createBundle(descriptor)
      const drawIndexed = encoder.drawIndexed.bind(encoder)
      encoder.drawIndexed = (count, instances, first, base, firstInstance) => {
        draws.push([count, instances ?? 1])
        drawIndexed(count, instances, first, base, firstInstance)
      }
      return encoder
    }
    const createCommand = device.createCommandEncoder.bind(device)
    device.createCommandEncoder = descriptor => {
      const encoder = createCommand(descriptor)
      const begin = encoder.beginRenderPass.bind(encoder)
      encoder.beginRenderPass = descriptor => {
        passes++
        const pass = begin(descriptor)
        const drawIndexed = pass.drawIndexed.bind(pass)
        pass.drawIndexed = (count, instances, first, base, firstInstance) => {
          draws.push([count, instances ?? 1])
          drawIndexed(count, instances, first, base, firstInstance)
        }
        return pass
      }
      return encoder
    }
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors)
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})

const geometry = new BufferGeometry()
geometry.setAttribute("position", new BufferAttribute(new Float32Array([-80, 0, -80, 80, 0, -80, 0, 0, 80]), 3))
geometry.setAttribute("normal", new BufferAttribute(new Float32Array([0, -1, 0, 0, -1, 0, 0, -1, 0]), 3))
geometry.setAttribute("skinIndex", new BufferAttribute(new Uint16Array(12), 4))
geometry.setAttribute("skinWeight", new BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]), 4))
geometry.setIndex(new BufferAttribute(new Uint16Array([0, 1, 2]), 1))
const material = new MeshLambertMaterial({color: 0xffffff})
const hidden = new Object3D()
hidden.visible = false
const clip = new AnimationClip("rise", 2, [new KeyframeTrack("joint", "vector", new Float32Array([0, 2]), new Float32Array([0, 0, -200, 0, 0, 200]))])
const rigs = [0, 1].map(index => {
  const root = new Object3D()
  root.position.x = index * 70
  const bone = new Object3D()
  bone.name = "joint"
  root.add(bone)
  const mesh = new SkinnedMesh(geometry, material, new Skeleton([bone], [new Matrix4()]))
  root.add(mesh)
  hidden.add(root)
  const mixer = new AnimationMixer(root)
  mixer.clipAction(clip).play()
  mixer.update(index === 0 ? .25 : 1.25)
  return {mesh, mixer}
})
const batch = new InstancedSkinnedMesh(rigs[0]!.mesh, 2)
batch.setPoseAt(1, rigs[1]!.mesh)
const left = new Matrix4().makeTranslation(-180, 0, 0)
const right = new Matrix4().makeTranslation(180, 0, 0)
batch.setMatrixAt(0, left)
batch.setMatrixAt(1, right)
const space = new Space()
space.background = new Color(0)
space.add(hidden)
space.add(batch)
const width = 160, height = 160
const viewPoint = new ViewPoint({position: {x: 0, y: -1200, z: 0}, target: {x: 0, y: 0, z: 0}, viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
const canvas = new NativeGpuCanvas(width, height)
const renderer = new Renderer()
const frames: {name: string, hash: string, passes: number, changedLeft: number, changedRight: number}[] = []
let previous: Uint8Array | undefined
try {
  await renderer.init(canvas.asHtmlCanvas())
  const device = canvas.getContext("webgpu")!.getConfiguration()!.device
  const frame = async (name: string) => {
    passes = 0
    device.pushErrorScope("validation")
    renderer.renderComposition({space, viewPoint})
    const error = await device.popErrorScope()
    if (error) throw new Error(`${name}: ${error.message}`)
    const {rgba} = await canvas.capture()
    let changedLeft = 0, changedRight = 0
    for (let pixel = 0; pixel < width * height; pixel++) {
      if (previous && rgba[pixel * 4] !== previous[pixel * 4]) {
        if (pixel % width < width / 2) changedLeft++
        else changedRight++
      }
    }
    frames.push({name, hash: new Bun.CryptoHasher("sha256").update(rgba).digest("hex"), passes, changedLeft, changedRight})
    previous = rgba
  }
  await frame("initial")
  const firstDraws = [...draws]
  await frame("repeat")
  rigs[1]!.mixer.update(.5)
  await frame("second-pose")
  await frame("pose-repeat")
  const allocationsAfterWarmup = created
  batch.count = 1
  await frame("one")
  batch.count = 2
  await frame("two")
  renderer.invalidateGeometry(batch.geometry)
  await frame("reallocated")
  batch.count = 0
  await frame("empty")
  renderer.dispose()
  console.log(JSON.stringify({frames, draws, firstDraws, palettes: [...batch.instanceBones], allocationsAfterWarmup, created, destroyed}))
} finally {
  renderer.dispose()
  canvas.getContext("webgpu")?.unconfigure()
  gpu.destroy()
}
