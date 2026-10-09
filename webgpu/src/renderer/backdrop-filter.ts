import {createBackdropKernel, type BackdropKernel} from "./backdrop-kernel"
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

/** Коэффициенты Gaussian вычисляются при подготовке shader, не в каждом fragment. */
const weights = Array.from({length: 19}, (_, index) => Math.exp(-.5 * ((index - 9) / 3) ** 2).toFixed(10)).join(", ")

function filterShader(multisampled: boolean, depth: boolean): string {
  return /* wgsl */ `
@group(0) @binding(0) var source: ${multisampled ? "texture_multisampled_2d<f32>" : "texture_2d<f32>"};
@group(0) @binding(1) var sourceSampler: sampler;
struct FilterParameters { steps: vec4f, plane: vec4f, kernel: vec4f, taps: array<vec4f, 19> }
@group(0) @binding(2) var<uniform> parameters: FilterParameters;
${depth ? "@group(0) @binding(3) var sceneDepth: texture_depth_multisampled_2d;" : ""}
const weights = array<f32, 19>(${weights});
override tapCount: u32 = 19u;
override compactKernel: bool = false;
fn resolved(pixel: vec2i) -> vec4f {
  let dimensions = textureDimensions(source);
  let p = clamp(pixel, vec2i(0), vec2i(dimensions) - vec2i(1));
  ${multisampled ? `
  var color = vec4f(0.0);
  let count = textureNumSamples(source);
  for (var index = 0u; index < count; index += 1u) {
    color += textureLoad(source, p, i32(index));
  }
  return color / f32(count);` : "return textureLoad(source, p, 0);"}
}
${multisampled && !depth ? `
fn linearSample(uv: vec2f) -> vec4f {
  let point = uv * vec2f(textureDimensions(source)) - vec2f(0.5);
  let low = vec2i(floor(point));
  let ratio = fract(point);
  return mix(mix(resolved(low), resolved(low + vec2i(1, 0)), ratio.x),
    mix(resolved(low + vec2i(0, 1)), resolved(low + vec2i(1, 1)), ratio.x), ratio.y);
}` : ""}
@vertex fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(positions[index], 0.0, 1.0);
}
@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * parameters.steps.xy;
  var color = vec4f(0.0);
  var total = 0.0;
  for (var index = 0u; index < tapCount; index += 1u) {
    var weight = weights[index];
    var offset = f32(i32(index) - 9) * parameters.steps.zw;
    if (compactKernel) {
      weight = parameters.taps[index].y;
      offset = vec2f(0.0, parameters.taps[index].x);
    }
    let sampleUv = uv + offset;
    ${depth ? `
    let sourceDimensions = textureDimensions(source);
    let sourcePixel = clamp(vec2i(sampleUv * vec2f(sourceDimensions)), vec2i(0), vec2i(sourceDimensions) - vec2i(1));
    let dimensions = textureDimensions(sceneDepth);
    let depthUv = (vec2f(sourcePixel) + vec2f(0.5)) / vec2f(sourceDimensions);
    let pixel = clamp(vec2i(depthUv * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - vec2i(1));
    let planeDepth = dot(vec3f(vec2f(pixel) + vec2f(0.5), 1.0), parameters.plane.xyz);
    var nearest = 1.0;
    for (var index = 0u; index < textureNumSamples(sceneDepth); index += 1u) {
      nearest = min(nearest, textureLoad(sceneDepth, pixel, i32(index)));
    }
    if (nearest + 0.0000002 < planeDepth) { continue; }
    color += resolved(sourcePixel) * weight;` : `
    color += ${multisampled ? "linearSample(sampleUv)" : "textureSampleLevel(source, sourceSampler, sampleUv, 0.0)"} * weight;`}
    total += weight;
  }
  return color / max(total, 0.000001);
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
type Scratch = {horizontal: GPUTexture, vertical: GPUTexture, composite: GPUBindGroup}
type Target = {width: number, height: number, source: GPUTexture, info: GPUBuffer, scratch: Map<number, Scratch>}
type Parameters = {buffer: GPUBuffer, data: Float32Array, groups: Map<GPUTexture, {group: GPUBindGroup, depth: GPUTexture | undefined}>}
type Pipeline = {layout: GPUBindGroupLayout, pipeline: GPURenderPipeline}

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
      const allocate = (label: string) => this.device.createTexture({label,
        size: [Math.max(1, Math.ceil(source.width / scale)), Math.max(1, Math.ceil(source.height / scale))],
        format: this.format, usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
      })
      let horizontal: GPUTexture | undefined, vertical: GPUTexture | undefined
      try {
        horizontal = allocate("backdrop-horizontal")
        vertical = allocate("backdrop-vertical")
        scratch = {horizontal, vertical, composite: this.device.createBindGroup({layout: this.compositeLayout, entries: [
          {binding: 0, resource: vertical.createView()}, {binding: 1, resource: this.#sampler}, {binding: 2, resource: {buffer: target.info}},
        ]})}
      } catch (error) {
        horizontal?.destroy()
        vertical?.destroy()
        throw error
      }
      target.scratch.set(scale, scratch)
    }
    const clip = (rect: BackdropBounds, padding: number): BackdropBounds => ({
      left: Math.max(0, Math.floor(rect.left - padding)), top: Math.max(0, Math.floor(rect.top - padding)),
      right: Math.min(source.width, Math.ceil(rect.right + padding)), bottom: Math.min(source.height, Math.ceil(rect.bottom + padding)),
    })
    const region = clip(bounds ?? {left: 0, top: 0, right: source.width, bottom: source.height}, scale * 2)
    const samples = clip(region, sigma * 3 + 2)
    if (region.right <= region.left || region.bottom <= region.top) return scratch.composite
    const output = operation === undefined ? null : this.#outputs.acquire(operation.key, target, target.info,
      scratch.vertical.width, scratch.vertical.height, operation.reusable)
    if (output?.hit) {
      this.#cursor += 2
      return output.group
    }
    operation?.beforeFilter?.()
    this.#pass(command, source, scratch.horizontal, sigma / 3 / source.width, 0,
      {left: region.left, right: region.right, top: samples.top, bottom: samples.bottom}, source, depth)
    const kernel = createBackdropKernel(sigma, scratch.horizontal.height, source.height, depth ? "nearestDepth" : "linear")
    this.#pass(command, scratch.horizontal, output?.texture ?? scratch.vertical, 0, sigma / 3 / source.height, region, source, depth, kernel)
    return output?.group ?? scratch.composite
  }

  #pipeline(source: GPUTexture, depth?: BackdropDepth, kernelCount = 19): Pipeline {
    const multi = (source.sampleCount ?? 1) > 1
    const key = `${multi}:${depth !== undefined}:${kernelCount}`
    let result = this.#pipelines.get(key)
    if (result) return result
    const entries: GPUBindGroupLayoutEntry[] = [
      {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {multisampled: multi, sampleType: multi ? "unfilterable-float" : "float"}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
      {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: "uniform"}},
    ]
    if (depth) entries.push({binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: "depth", multisampled: true}})
    const layout = this.device.createBindGroupLayout({entries})
    const module = this.device.createShaderModule({label: `backdrop-gaussian:${key}`, code: filterShader(multi, depth !== undefined)})
    const pipeline = this.device.createRenderPipeline({label: `backdrop-gaussian:${key}`, layout: this.device.createPipelineLayout({bindGroupLayouts: [layout]}),
      vertex: {module, entryPoint: "vs_main"}, fragment: {module, entryPoint: "fs_main", constants: {tapCount: kernelCount, compactKernel: Number(kernelCount < 19)}, targets: [{format: this.format}]}, primitive: {topology: "triangle-list"},
    })
    result = {layout, pipeline}
    this.#pipelines.set(key, result)
    return result
  }

  #pass(command: GPUCommandEncoder, source: GPUTexture, destination: GPUTexture, x: number, y: number, bounds: BackdropBounds, target: GPUTexture, depth?: BackdropDepth, kernel?: BackdropKernel): void {
    const parameterIndex = this.#cursor++
    while (this.#parameters.length <= parameterIndex) {
      this.#parameters.push({buffer: this.device.createBuffer({size: 352, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST}), data: new Float32Array(88), groups: new Map()})
    }
    const parameters = this.#parameters[parameterIndex]!
    parameters.data.fill(0, 0, 12)
    parameters.data.set([1 / destination.width, 1 / destination.height, x, y, ...(depth?.plane ?? [0, 0, 0]), 0])
    if (kernel && kernel.count < 19) {
      parameters.data[8] = kernel.count
      for (let index = 0; index < kernel.count; index++) {
        parameters.data[12 + index * 4] = kernel.offsets[index]! / source.height
        parameters.data[13 + index * 4] = kernel.weights[index]!
      }
    }
    this.device.queue.writeBuffer(parameters.buffer, 0, parameters.data)
    const {pipeline, layout} = this.#pipeline(source, depth, kernel?.count ?? 19)
    let cached = parameters.groups.get(source)
    if (!cached || cached.depth !== depth?.texture) {
      const entries: GPUBindGroupEntry[] = [
        {binding: 0, resource: source.createView()}, {binding: 1, resource: this.#sampler}, {binding: 2, resource: {buffer: parameters.buffer}},
      ]
      if (depth) entries.push({binding: 3, resource: depth.texture.createView({aspect: "depth-only"})})
      cached = {depth: depth?.texture, group: this.device.createBindGroup({layout, entries})}
      parameters.groups.set(source, cached)
    }
    const pass = command.beginRenderPass({label: "backdrop-blur", colorAttachments: [{view: destination.createView(), loadOp: "load", storeOp: "store"}]})
    const left = Math.floor(bounds.left * destination.width / target.width)
    const top = Math.floor(bounds.top * destination.height / target.height)
    pass.setScissorRect(left, top, Math.ceil(bounds.right * destination.width / target.width) - left, Math.ceil(bounds.bottom * destination.height / target.height) - top)
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, cached.group)
    pass.draw(3)
    pass.end()
  }

  #destroyTarget(target: Target, releaseOutputs = true): void {
    if (releaseOutputs) this.#outputs.releaseTarget(target)
    const textures = [...target.scratch.values()].flatMap(value => [value.horizontal, value.vertical])
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
