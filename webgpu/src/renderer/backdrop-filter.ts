import {createDenseBackdropKernel, type BackdropKernel} from "./backdrop-kernel"
import {roundedShader} from "./shader/ui-shaders"
import {BackdropOutputCache} from "./backdrop-output-cache.ts"

export type BackdropCompositeMode = "dual" | "color" | "alpha"

/** Смешивает premultiplied фон с MSAA destination, не читая собственный attachment. */
export function backdropCompositeShader(mode: BackdropCompositeMode): string {
  let shape = roundedShader.slice(0, roundedShader.indexOf("    if (shadowBlur > 0.0"))
  if (mode === "dual") shape = shape.replace("fn fs_main(in: VertexOutput) -> @location(0) vec4<f32>", "fn fs_main(in: VertexOutput) -> BackdropOutput")
  return `${mode === "dual" ? `enable dual_source_blending;
struct BackdropOutput {
  @location(0) @blend_src(0) color: vec4f,
  @location(0) @blend_src(1) coverage: vec4f,
}` : ""}
@group(2) @binding(0) var backdropBlurred: texture_2d<f32>;
@group(2) @binding(1) var backdropSampler: sampler;
@group(2) @binding(2) var<uniform> backdropSize: vec4f;
${shape}
    let coverage = clamp(outerMask * opacity * presentationCoverage, 0.0, 1.0);
    if (coverage <= 0.0) { discard; }
    let uv = in.position.xy / backdropSize.xy;
    let blurred = textureSampleLevel(backdropBlurred, backdropSampler, uv, 0.0);
    ${mode === "dual" ? "return BackdropOutput(blurred * coverage, vec4f(coverage));" : mode === "color"
      ? "return vec4f(blurred.rgb, coverage);" : "return vec4f(0.0, 0.0, 0.0, blurred.a * coverage);"}
}
`
}

type FilterStage = "prefilter" | "horizontal" | "vertical"

/** Один workgroup усредняет полный footprint одного reduced texel без пропусков. */
function prefilterShader(samples: number, depth: boolean, lanes: number): string {
  const multisampled = samples > 1
  return /* wgsl */ `
@group(0) @binding(0) var source: ${multisampled ? "texture_multisampled_2d<f32>" : "texture_2d<f32>"};
struct FilterParameters { steps: vec4f, plane: vec4f, kernel: vec4f, taps: array<vec4f, 1> }
@group(0) @binding(2) var<uniform> parameters: FilterParameters;
${depth ? "@group(0) @binding(3) var sceneDepth: texture_depth_multisampled_2d;" : ""}
@group(0) @binding(4) var outputColor: texture_storage_2d<rgba16float, write>;
@group(0) @binding(5) var outputValidity: texture_storage_2d<rgba16float, write>;
var<workgroup> colors: array<vec4f, ${lanes}>;
var<workgroup> validity: array<f32, ${lanes}>;
@compute @workgroup_size(${Math.min(8, lanes)}, ${Math.ceil(lanes / 8)}) fn cs_main(@builtin(workgroup_id) group: vec3u, @builtin(local_invocation_index) lane: u32) {
  let outputPixel = group.xy + vec2u(parameters.kernel.xy);
  let dimensions = vec2f(textureDimensions(source));
  let extent = dimensions * parameters.steps.xy;
  let low = vec2f(outputPixel) * extent;
  let high = min(low + extent, dimensions);
  let origin = vec2i(floor(low));
  let span = vec2u(ceil(high) - floor(low));
  var color = vec4f(0.0);
  var valid = 0.0;
  for (var index = lane; index < span.x * span.y; index += ${lanes}u) {
    let pixel = clamp(origin + vec2i(i32(index % span.x), i32(index / span.x)), vec2i(0), vec2i(dimensions) - vec2i(1));
    let point = vec2f(pixel);
    let area = max(vec2f(0.0), min(point + vec2f(1.0), high) - max(point, low));
    let weight = area.x * area.y / (extent.x * extent.y);
    let contribution = weight / ${samples}.0;
    ${depth ? "let planeDepth = dot(vec3f(point + vec2f(0.5), 1.0), parameters.plane.xyz);" : ""}
    ${Array.from({length: samples}, (_, sample) => `
    let contribution${sample} = ${depth ? `select(0.0, contribution, textureLoad(sceneDepth, pixel, ${sample}) + 0.0000002 >= planeDepth)` : "contribution"};
    color += textureLoad(source, pixel, ${multisampled ? sample : 0}) * contribution${sample};
    valid += contribution${sample};`).join("")}

  }
  colors[lane] = color;
  validity[lane] = valid;
  for (var stride = ${Math.floor(lanes / 2)}u; stride > 0u; stride /= 2u) {
    workgroupBarrier();
    if (lane < stride) {
      colors[lane] += colors[lane + stride];
      validity[lane] += validity[lane + stride];
    }
  }
  if (lane == 0u) {
    textureStore(outputColor, vec2i(outputPixel), colors[0]);
    textureStore(outputValidity, vec2i(outputPixel), vec4f(validity[0], 0.0, 0.0, 0.0));
  }
}
`
}

/** Полная Gaussian на уменьшенной сетке, цвет и validity сворачиваются совместно. */
function filterShader(stage: FilterStage, count: number): string {
  const final = stage === "vertical"
  return /* wgsl */ `
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
struct FilterParameters { steps: vec4f, plane: vec4f, kernel: vec4f, taps: array<vec4f, ${count}> }
@group(0) @binding(2) var<uniform> parameters: FilterParameters;
@group(0) @binding(3) var validity: texture_2d<f32>;
${final ? "" : "struct FilterOutput { @location(0) color: vec4f, @location(1) validity: f32 }"}
@vertex fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(positions[index], 0.0, 1.0);
}
@fragment fn fs_main(@builtin(position) position: vec4f) -> ${final ? "@location(0) vec4f" : "FilterOutput"} {
  let uv = position.xy * parameters.steps.xy;
  var color = vec4f(0.0);
  var valid = 0.0;
  var total = 0.0;
  for (var index = 0u; index < ${count}u; index += 1u) {
    let tap = parameters.taps[index];
    let sampleUv = uv + tap.x * parameters.steps.zw;
    color += textureSampleLevel(source, sourceSampler, sampleUv, 0.0) * tap.y;
    valid += textureSampleLevel(validity, sourceSampler, sampleUv, 0.0).r * tap.y;
    total += tap.y;
  }
  ${final ? "return color / max(valid, 0.000001);" : "return FilterOutput(color / total, valid / total);"}
}
`
}

export type BackdropDepth = Readonly<{texture: GPUTexture, plane: readonly [number, number, number]}>
export type BackdropBounds = Readonly<{left: number, top: number, right: number, bottom: number}>
export type BackdropOperation = Readonly<{
  key: object
  reusable: boolean
  beforeFilter?: () => void
}>
type Scratch = {prefilter: GPUTexture, prefilterValidity: GPUTexture, horizontal: GPUTexture, horizontalValidity: GPUTexture, vertical: GPUTexture, composite: GPUBindGroup}
type Target = {width: number, height: number, source: GPUTexture, info: GPUBuffer, scratch: Map<number, Scratch>}
type Parameters = {buffer: GPUBuffer, data: Float32Array, groups: Map<GPUTexture, {group: GPUBindGroup, auxiliary: GPUTexture | undefined, destination: GPUTexture | undefined}>}
type Pipeline = {layout: GPUBindGroupLayout, pipeline: GPURenderPipeline | GPUComputePipeline}

/** Фильтрует текущий MSAA target по ROI; полноразмерный snapshot не создаётся. */
export class BackdropFilter {
  readonly compositeLayout: GPUBindGroupLayout
  readonly #pipelines = new Map<string, Pipeline>()
  readonly #sampler: GPUSampler
  readonly #targets = new Map<object, Target>()
  readonly #parameters: Parameters[] = []
  readonly #outputs: BackdropOutputCache
  #cursor = 0

  constructor(readonly device: GPUDevice, readonly format: GPUTextureFormat) {
    this.#sampler = device.createSampler({minFilter: "linear", magFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge"})
    this.compositeLayout = device.createBindGroupLayout({entries: [
      {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
      {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: "uniform"}},
    ]})
    this.#outputs = new BackdropOutputCache(device, format, this.compositeLayout, this.#sampler)
  }

  beginFrame(active: ReadonlySet<object>): void {
    this.#outputs.beginFrame()
    this.#cursor = 0
    for (const [key, target] of this.#targets) if (!active.has(key)) {
      this.#destroyTarget(target)
      this.#targets.delete(key)
    }
  }

  encode(command: GPUCommandEncoder, source: GPUTexture, sigma: number, key: object = source, bounds?: BackdropBounds, depth?: BackdropDepth, operation?: BackdropOperation): GPUBindGroup {
    let target = this.#targets.get(key)
    if (target && (target.width !== source.width || target.height !== source.height)) {
      this.release(key)
      target = undefined
    }
    if (!target) {
      const info = this.device.createBuffer({label: "backdrop-target-size", size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST})
      this.device.queue.writeBuffer(info, 0, new Float32Array([source.width, source.height, 0, 0]))
      target = {width: source.width, height: source.height, source, info, scratch: new Map()}
      this.#targets.set(key, target)
    } else if (target.source !== source) {
      for (const parameters of this.#parameters) parameters.groups.delete(target.source)
      target.source = source
    }
    const scale = sigma >= 8 ? 8 : sigma >= 4 ? 4 : sigma >= 2 ? 2 : 1
    let scratch = target.scratch.get(scale)
    if (!scratch) {
      const allocated: GPUTexture[] = []
      const allocate = (label: string, format: GPUTextureFormat, storage = false) => {
        const texture = this.device.createTexture({label,
          size: [Math.max(1, Math.ceil(source.width / scale)), Math.max(1, Math.ceil(source.height / scale))],
          format, usage: GPUTextureUsage.TEXTURE_BINDING | (storage ? GPUTextureUsage.STORAGE_BINDING : GPUTextureUsage.RENDER_ATTACHMENT),
        })
        allocated.push(texture)
        return texture
      }
      try {
        const prefilter = allocate("backdrop-prefilter", "rgba16float", true)
        const prefilterValidity = allocate("backdrop-prefilter-validity", "rgba16float", true)
        const horizontal = allocate("backdrop-horizontal", "rgba16float")
        const horizontalValidity = allocate("backdrop-horizontal-validity", "r16float")
        const vertical = allocate("backdrop-vertical", this.format)
        scratch = {prefilter, prefilterValidity, horizontal, horizontalValidity, vertical,
          composite: this.device.createBindGroup({layout: this.compositeLayout, entries: [
            {binding: 0, resource: vertical.createView()}, {binding: 1, resource: this.#sampler}, {binding: 2, resource: {buffer: target.info}},
          ]})}
      } catch (error) {
        for (const texture of allocated) texture.destroy()
        throw error
      }
      target.scratch.set(scale, scratch)
    }
    const clip = (rect: BackdropBounds, padding: number): BackdropBounds => ({
      left: Math.max(0, Math.floor(rect.left - padding)), top: Math.max(0, Math.floor(rect.top - padding)),
      right: Math.min(source.width, Math.ceil(rect.right + padding)), bottom: Math.min(source.height, Math.ceil(rect.bottom + padding)),
    })
    const region = clip(bounds ?? {left: 0, top: 0, right: source.width, bottom: source.height}, scale * 2)
    const samples = clip(region, sigma * 3 + scale * 2)
    if (region.right <= region.left || region.bottom <= region.top) return scratch.composite
    const output = operation === undefined ? null : this.#outputs.acquire(operation.key, target, target.info,
      scratch.vertical.width, scratch.vertical.height, operation.reusable)
    if (output?.hit) {
      this.#cursor += 3
      return output.group
    }
    operation?.beforeFilter?.()
    this.#pass(command, source, scratch.prefilter, "prefilter", samples, source, depth, undefined, scratch.prefilterValidity)
    const horizontalKernel = createDenseBackdropKernel(sigma, scratch.prefilter.width, source.width)
    this.#pass(command, scratch.prefilter, scratch.horizontal, "horizontal",
      {left: region.left, right: region.right, top: samples.top, bottom: samples.bottom}, source,
      undefined, horizontalKernel, scratch.horizontalValidity, scratch.prefilterValidity)
    const verticalKernel = createDenseBackdropKernel(sigma, scratch.horizontal.height, source.height)
    this.#pass(command, scratch.horizontal, output?.texture ?? scratch.vertical, "vertical", region, source,
      undefined, verticalKernel, undefined, scratch.horizontalValidity)
    return output?.group ?? scratch.composite
  }

  #pipeline(source: GPUTexture, stage: FilterStage, depth: boolean, kernelCount: number, lanes: number): Pipeline {
    const multi = (source.sampleCount ?? 1) > 1
    const key = `${source.sampleCount ?? 1}:${depth}:${stage}:${kernelCount}:${lanes}`
    let result = this.#pipelines.get(key)
    if (result) return result
    const visibility = stage === "prefilter" ? GPUShaderStage.COMPUTE : GPUShaderStage.FRAGMENT
    const entries: GPUBindGroupLayoutEntry[] = [
      {binding: 0, visibility, texture: {multisampled: multi, sampleType: multi ? "unfilterable-float" : "float"}},
      {binding: 1, visibility, sampler: {}},
      {binding: 2, visibility, buffer: {type: "uniform"}},
    ]
    if (stage !== "prefilter" || depth) entries.push({binding: 3, visibility,
      texture: stage === "prefilter" ? {sampleType: "depth", multisampled: true} : {}})
    if (stage === "prefilter") for (const binding of [4, 5]) entries.push({binding, visibility,
      storageTexture: {access: "write-only", format: "rgba16float"}})
    const layout = this.device.createBindGroupLayout({entries})
    const module = this.device.createShaderModule({label: `backdrop-gaussian:${key}`, code: stage === "prefilter" ? prefilterShader(source.sampleCount ?? 1, depth, lanes) : filterShader(stage, kernelCount)})
    const pipeline = stage === "prefilter" ? this.device.createComputePipeline({label: `backdrop-area:${key}`,
      layout: this.device.createPipelineLayout({bindGroupLayouts: [layout]}), compute: {module, entryPoint: "cs_main"},
    }) : this.device.createRenderPipeline({label: `backdrop-gaussian:${key}`, layout: this.device.createPipelineLayout({bindGroupLayouts: [layout]}),
      vertex: {module, entryPoint: "vs_main"}, fragment: {module, entryPoint: "fs_main", targets: stage === "vertical" ? [{format: this.format}] : [{format: "rgba16float"}, {format: "r16float"}]}, primitive: {topology: "triangle-list"},
    })
    result = {layout, pipeline}
    this.#pipelines.set(key, result)
    return result
  }

  #pass(command: GPUCommandEncoder, source: GPUTexture, destination: GPUTexture, stage: FilterStage, bounds: BackdropBounds,
    target: GPUTexture, depth?: BackdropDepth, kernel?: BackdropKernel, destinationValidity?: GPUTexture, sourceValidity?: GPUTexture): void {
    const parameterIndex = this.#cursor++
    const count = kernel?.count ?? 1
    const size = (12 + Math.max(19, count) * 4) * 4
    while (this.#parameters.length <= parameterIndex) {
      this.#parameters.push({buffer: this.device.createBuffer({size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST}),
        data: new Float32Array(size / 4), groups: new Map()})
    }
    let parameters = this.#parameters[parameterIndex]!
    if (parameters.data.byteLength < size) {
      const replacement: Parameters = {buffer: this.device.createBuffer({size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST}),
        data: new Float32Array(size / 4), groups: new Map()}
      parameters.buffer.destroy()
      parameters = replacement
      this.#parameters[parameterIndex] = parameters
    }
    const left = Math.floor(bounds.left * destination.width / target.width)
    const top = Math.floor(bounds.top * destination.height / target.height)
    const width = Math.ceil(bounds.right * destination.width / target.width) - left
    const height = Math.ceil(bounds.bottom * destination.height / target.height) - top
    parameters.data.fill(0)
    if (stage === "prefilter") parameters.data.set([left, top], 8)
    parameters.data.set([1 / destination.width, 1 / destination.height,
      stage === "horizontal" ? 1 / source.width : 0, stage === "vertical" ? 1 / source.height : 0,
      ...(depth?.plane ?? [0, 0, 0]), 0])
    if (kernel) for (let index = 0; index < count; index++) {
      parameters.data[12 + index * 4] = kernel.offsets[index]!
      parameters.data[13 + index * 4] = kernel.weights[index]!
    }
    this.device.queue.writeBuffer(parameters.buffer, 0, parameters.data)
    const footprint = Math.ceil(source.width / destination.width) * Math.ceil(source.height / destination.height)
    const lanes = stage === "prefilter" ? Math.min(32, 2 ** Math.ceil(Math.log2(footprint))) : 0
    const {pipeline, layout} = this.#pipeline(source, stage, depth !== undefined, count, lanes)
    const auxiliary = depth?.texture ?? sourceValidity
    let cached = parameters.groups.get(source)
    if (!cached || cached.auxiliary !== auxiliary || (stage === "prefilter" && cached.destination !== destination)) {
      const entries: GPUBindGroupEntry[] = [
        {binding: 0, resource: source.createView()}, {binding: 1, resource: this.#sampler}, {binding: 2, resource: {buffer: parameters.buffer}},
      ]
      if (auxiliary) entries.push({binding: 3, resource: auxiliary.createView(depth ? {aspect: "depth-only"} : {})})
      if (stage === "prefilter") entries.push({binding: 4, resource: destination.createView()}, {binding: 5, resource: destinationValidity!.createView()})
      cached = {auxiliary, destination: stage === "prefilter" ? destination : undefined, group: this.device.createBindGroup({layout, entries})}
      parameters.groups.set(source, cached)
    }
    if (stage === "prefilter") {
      const pass = command.beginComputePass({label: "backdrop-blur"})
      pass.setPipeline(pipeline as GPUComputePipeline)
      pass.setBindGroup(0, cached.group)
      pass.dispatchWorkgroups(width, height)
      pass.end()
    } else {
      const pass = command.beginRenderPass({label: "backdrop-blur", colorAttachments: [destination, ...(destinationValidity ? [destinationValidity] : [])].map(texture => ({view: texture.createView(), loadOp: "load", storeOp: "store"}))})
      pass.setScissorRect(left, top, width, height)
      pass.setPipeline(pipeline as GPURenderPipeline)
      pass.setBindGroup(0, cached.group)
      pass.draw(3)
      pass.end()
    }
  }

  #destroyTarget(target: Target, releaseOutputs = true): void {
    if (releaseOutputs) this.#outputs.releaseTarget(target)
    const textures = [...target.scratch.values()].flatMap(value => [value.prefilter, value.prefilterValidity, value.horizontal, value.horizontalValidity, value.vertical])
    for (const parameters of this.#parameters) {
      parameters.groups.delete(target.source)
      for (const texture of textures) parameters.groups.delete(texture)
    }
    for (const texture of textures) texture.destroy()
    target.info.destroy()
  }

  release(key: object): void {
    const target = this.#targets.get(key)
    if (target) this.#destroyTarget(target)
    this.#targets.delete(key)
  }

  endFrame(): void {
    this.#outputs.endFrame()
    for (const parameters of this.#parameters.splice(this.#cursor)) parameters.buffer.destroy()
  }

  /** Отменяет pending outputs и снимает pins перед cleanup ошибочного кадра. */
  abortFrame(): void {
    this.#outputs.beginFrame()
    this.#cursor = 0
  }

  dispose(): void {
    this.#outputs.dispose()
    for (const target of this.#targets.values()) this.#destroyTarget(target, false)
    this.#targets.clear()
    for (const parameters of this.#parameters) parameters.buffer.destroy()
    this.#parameters.length = 0
  }
}
