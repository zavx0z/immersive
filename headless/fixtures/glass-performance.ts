import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {BoxGeometry, BufferAttribute, BufferGeometry, Color, DirectionalLight, GlassMaterial, Mesh, MeshBasicMaterial, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {Renderer} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics"

/** Короткий native workload: wall time render + completion, без browser frame loop. */
const width = 2730, height = 2176
const boxCount = 428, batchCount = 7, warmupFrames = 5, measuredFrames = 20
const colors = [0x97c9e3, 0xf3b6bc, 0xd0bcf2, 0xb0dbc3, 0xeccf98, 0xadc3e9, 0xd7c5aa]
const gpu = createGPUInstance()
let adapterInfo: unknown = null
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

// Геометрия объединяется ровно один раз, до init и измерений, через публичный Engine API.
const box = new BoxGeometry({width: 95, height: 95, depth: 95})
const positions = box.attributes.position!, normals = box.attributes.normal!, uvs = box.attributes.uv!
const indices = box.index!
const geometries = Array.from({length: batchCount}, (_, batch) => {
  const members = Array.from({length: boxCount}, (_, index) => index).filter(index => index % batchCount === batch)
  const mergedPositions = new Float32Array(members.length * positions.array.length)
  const mergedNormals = new Float32Array(members.length * normals.array.length)
  const mergedUvs = new Float32Array(members.length * uvs.array.length)
  const mergedIndices = new Uint16Array(members.length * indices.count)
  for (const [member, index] of members.entries()) {
    const x = (index % 22 - 10.5) * 110
    const y = (index % 3 - 1) * 80
    const z = (Math.floor(index / 22) - 9.5) * 105
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const source = vertex * 3, target = member * positions.array.length + source
      mergedPositions[target] = positions.array[source]! + x
      mergedPositions[target + 1] = positions.array[source + 1]! + y
      mergedPositions[target + 2] = positions.array[source + 2]! + z
    }
    mergedNormals.set(normals.array, member * normals.array.length)
    mergedUvs.set(uvs.array, member * uvs.array.length)
    for (let index = 0; index < indices.count; index++) mergedIndices[member * indices.count + index] = indices.array[index]! + member * positions.count
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(mergedPositions, 3))
  geometry.setAttribute("normal", new BufferAttribute(mergedNormals, 3))
  geometry.setAttribute("uv", new BufferAttribute(mergedUvs, 2))
  geometry.setIndex(new BufferAttribute(mergedIndices, 1))
  geometry.computeBoundingSphere()
  return geometry
})
const canvas = new NativeGpuCanvas(width, height)
const renderer = new Renderer()
const space = new Space()
space.background = new Color(.9, .92, .95)
const meshes = geometries.map((geometry, index) => new Mesh(geometry, new MeshBasicMaterial({color: colors[index]!})))
for (const mesh of meshes) space.add(mesh)
const light = new DirectionalLight(0xffffff, 1)
light.position.set(-1500, -3000, 2500)
space.add(light)
const viewPoint = new ViewPoint({position: {x: 350, y: -3300, z: 1450}, target: {x: 0, y: 0, z: 0},
  viewport: {left: 0, top: 0, width, height}, near: .1, far: 10000})

try {
  await renderer.init(canvas.asHtmlCanvas())
  const context = canvas.getContext("webgpu")!
  const device = context.getConfiguration()!.device
  let completionMethod = "queue.onSubmittedWorkDone"
  let fence: GPUBuffer | null = null
  try {
    await device.queue.onSubmittedWorkDone()
  } catch (error) {
    if (!(error instanceof Error) || !/not (?:yet )?implemented|not a function/i.test(error.message)) throw error
    completionMethod = "1px copyTextureToBuffer + mapAsync fence (256-byte reusable buffer)"
    fence = device.createBuffer({size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ})
  }
  const complete = async () => {
    if (fence === null) return device.queue.onSubmittedWorkDone()
    const encoder = device.createCommandEncoder()
    encoder.copyTextureToBuffer({texture: context.getCurrentTexture()}, {buffer: fence, bytesPerRow: 256}, {width: 1, height: 1})
    device.queue.submit([encoder.finish()])
    await fence.mapAsync(GPUMapMode.READ)
    fence.unmap()
  }
  const started = performance.now()
  const measure = async () => {
    const samples: number[] = []
    device.pushErrorScope("validation")
    for (let frame = 0; frame < warmupFrames + measuredFrames; frame++) {
      if (performance.now() - started > 25_000) throw new Error("Native benchmark exceeded bounded 25-second frame budget")
      const start = performance.now()
      renderer.renderComposition({space, viewPoint})
      await complete()
      const elapsed = performance.now() - start
      if (frame >= warmupFrames) samples.push(elapsed)
    }
    const validation = await device.popErrorScope()
    if (validation !== null) throw new Error(validation.message)
    const sorted = [...samples].sort((a, b) => a - b)
    const percentile = (fraction: number) => sorted[Math.ceil(fraction * sorted.length) - 1]!
    return {p50Ms: percentile(.5), p95Ms: percentile(.95), samplesMs: samples}
  }
  const zeroGlassBaseline = await measure()
  for (const [index, mesh] of meshes.entries()) {
    const tint = new Color(colors[index]!)
    tint.a = .35
    mesh.material = new GlassMaterial({tintColor: tint, thickness: .8, ior: 1.5, roughness: .25})
  }
  const glass = await measure()
  fence?.destroy()
  const output = {
    generatedAt: new Date().toISOString(), adapterInfo, canvas: {width, height, pixels: width * height},
    workload: {boxes: boxCount, staticMeshBatches: batchCount, meshObjects: meshes.length, lights: 1,
      vertices: boxCount * positions.count, indices: boxCount * indices.count, triangles: boxCount * indices.count / 3,
      boxDimensionsMm: [95, 95, 95], mergedOnceBeforeMeasurement: true},
    method: {metric: "wall time of Renderer.renderComposition + GPU completion", completionMethod, warmupFrames, measuredFrames,
      order: ["zeroGlassBaseline", "glass"],
      limitations: ["Synthetic native scene, not live application FPS or pure GPU time", "Includes CPU command work, submission and completion wait", "No browser, DOM, HUD, input, animation or presentation/vsync", "Fixed phase order and small sample count; p95 is descriptive", "Baseline renders the same boxes with opaque MeshBasicMaterial; it is not optical parity"]},
    extraOitResidentBytes: width * height * 20,
    extraOitResidentFormula: "width * height * 20, excluding existing opaque MSAA/depth and allocator overhead",
    zeroGlassBaseline, glass, p50RatioGlassToBaseline: glass.p50Ms / zeroGlassBaseline.p50Ms,
    totalMeasurementWallMs: performance.now() - started,
  }
  if (Bun.argv[2]) await Bun.write(Bun.argv[2], JSON.stringify(output, null, 2) + "\n")
  console.log(JSON.stringify(output))
} finally {
  renderer.dispose()
  canvas.dispose()
  gpu.destroy()
}
