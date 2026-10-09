import {roundedShader} from "./shader/ui-shaders"

/** Обратная запись размытого backdrop с теми же rounded mask и clip chain, что у Rect. */
export const backdropCompositeShader = `
@group(2) @binding(0) var backdropOriginal: texture_2d<f32>;
@group(2) @binding(1) var backdropBlurred: texture_2d<f32>;
@group(2) @binding(2) var backdropSampler: sampler;
${roundedShader.slice(0, roundedShader.indexOf("    if (shadowBlur > 0.0"))}
    let coverage = outerMask * opacity * presentationCoverage;
    if (coverage <= 0.0) { discard; }
    let original = textureLoad(backdropOriginal, vec2i(in.position.xy), 0);
    let uv = in.position.xy / vec2f(textureDimensions(backdropOriginal));
    let blurred = textureSampleLevel(backdropBlurred, backdropSampler, uv, 0.0);
    // Полная замена premultiplied RGBA сохраняет alpha; source-over удвоил бы фон.
    return mix(original, blurred, clamp(coverage, 0.0, 1.0));
}
`

const filterShader = /* wgsl */ `
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
@group(0) @binding(2) var<uniform> parameters: vec4f;
@vertex fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(positions[index], 0.0, 1.0);
}
@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let uv = position.xy * parameters.xy;
  var color = vec4f(0.0);
  var total = 0.0;
  // Разделимый Gaussian, 9 выборок на ось, радиус 3 sigma.
  for (var i = -4; i <= 4; i += 1) {
    let distance = f32(i) * 0.75;
    let weight = exp(-0.5 * distance * distance);
    color += textureSampleLevel(source, sourceSampler, uv + f32(i) * parameters.zw, 0.0) * weight;
    total += weight;
  }
  return color / total;
}
`

export type BackdropBounds = Readonly<{left: number, top: number, right: number, bottom: number}>

type Scratch = {horizontal: GPUTexture, vertical: GPUTexture, composite: GPUBindGroup}
type Target = {snapshot: GPUTexture, scratch: Map<number, Scratch>}
type Parameters = {buffer: GPUBuffer, groups: Map<GPUTexture, GPUBindGroup>}

/** Ресурсы принадлежат Renderer: один снимок target и переиспользуемые уменьшенные фильтры. */
export class BackdropFilter {
  readonly compositeLayout: GPUBindGroupLayout
  readonly #layout: GPUBindGroupLayout
  readonly #pipeline: GPURenderPipeline
  readonly #sampler: GPUSampler
  readonly #targets = new Map<object, Target>()
  readonly #parameters: Parameters[] = []
  #cursor = 0

  constructor(readonly device: GPUDevice, readonly format: GPUTextureFormat) {
    this.#sampler = device.createSampler({minFilter: "linear", magFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge"})
    this.#layout = device.createBindGroupLayout({entries: [
      {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
      {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: "uniform"}},
    ]})
    this.compositeLayout = device.createBindGroupLayout({entries: [
      {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {}},
      {binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
    ]})
    const module = device.createShaderModule({label: "backdrop-gaussian", code: filterShader})
    this.#pipeline = device.createRenderPipeline({label: "backdrop-gaussian", layout: device.createPipelineLayout({bindGroupLayouts: [this.#layout]}),
      vertex: {module, entryPoint: "vs_main"}, fragment: {module, entryPoint: "fs_main", targets: [{format}]}, primitive: {topology: "triangle-list"},
    })
  }

  /** Новый command buffer переиспользует uniform slots; удалённые targets освобождаются. */
  beginFrame(active: ReadonlySet<object>): void {
    this.#cursor = 0
    for (const [texture, target] of this.#targets) if (!active.has(texture)) {
      this.#destroyTarget(target)
      this.#targets.delete(texture)
    }
  }

  /** Фильтрует уже нарисованный target; каждый следующий вызов видит предыдущие окна. */
  encode(command: GPUCommandEncoder, source: GPUTexture, sigma: number, key: object = source, bounds?: BackdropBounds): GPUBindGroup {
    let target = this.#targets.get(key)
    if (target && (target.snapshot.width !== source.width || target.snapshot.height !== source.height)) {
      this.release(key)
      target = undefined
    }
    if (!target) {
      target = {snapshot: this.device.createTexture({label: "backdrop-snapshot", size: [source.width, source.height], format: this.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST}), scratch: new Map()}
      this.#targets.set(key, target)
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
          {binding: 0, resource: target.snapshot.createView()}, {binding: 1, resource: vertical.createView()}, {binding: 2, resource: this.#sampler},
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
    const origin = {x: samples.left, y: samples.top}
    command.copyTextureToTexture({texture: source, origin}, {texture: target.snapshot, origin}, [samples.right - samples.left, samples.bottom - samples.top])
    this.#pass(command, target.snapshot, scratch.horizontal, sigma * 0.75 / source.width, 0,
      {left: region.left, right: region.right, top: samples.top, bottom: samples.bottom}, source)
    this.#pass(command, scratch.horizontal, scratch.vertical, 0, sigma * 0.75 / source.height, region, source)
    return scratch.composite
  }

  #pass(command: GPUCommandEncoder, source: GPUTexture, destination: GPUTexture, x: number, y: number, bounds: BackdropBounds, target: GPUTexture): void {
    let parameters = this.#parameters[this.#cursor++]
    if (!parameters) {
      parameters = {buffer: this.device.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST}), groups: new Map()}
      this.#parameters.push(parameters)
    }
    this.device.queue.writeBuffer(parameters.buffer, 0, new Float32Array([1 / destination.width, 1 / destination.height, x, y]))
    let group = parameters.groups.get(source)
    if (!group) {
      group = this.device.createBindGroup({layout: this.#layout, entries: [
        {binding: 0, resource: source.createView()}, {binding: 1, resource: this.#sampler}, {binding: 2, resource: {buffer: parameters.buffer}},
      ]})
      parameters.groups.set(source, group)
    }
    const pass = command.beginRenderPass({label: "backdrop-blur", colorAttachments: [{view: destination.createView(), loadOp: "clear", storeOp: "store"}]})
    const left = Math.floor(bounds.left * destination.width / target.width)
    const top = Math.floor(bounds.top * destination.height / target.height)
    pass.setScissorRect(left, top, Math.ceil(bounds.right * destination.width / target.width) - left, Math.ceil(bounds.bottom * destination.height / target.height) - top)
    pass.setPipeline(this.#pipeline)
    pass.setBindGroup(0, group)
    pass.draw(3)
    pass.end()
  }

  #destroyTarget(target: Target): void {
    const textures = [target.snapshot, ...[...target.scratch.values()].flatMap(value => [value.horizontal, value.vertical])]
    for (const texture of textures) {
      for (const parameters of this.#parameters) parameters.groups.delete(texture)
      texture.destroy()
    }
  }

  /** Освобождает удалённый Display сразу, не ожидая нового кадра. */
  release(key: object): void {
    const target = this.#targets.get(key)
    if (target) this.#destroyTarget(target)
    this.#targets.delete(key)
  }

  /** Не держит uniform slots для окон, которых больше нет в кадре. */
  endFrame(): void {
    for (const parameters of this.#parameters.splice(this.#cursor)) parameters.buffer.destroy()
  }

  dispose(): void {
    for (const target of this.#targets.values()) this.#destroyTarget(target)
    this.#targets.clear()
    for (const parameters of this.#parameters) parameters.buffer.destroy()
    this.#parameters.length = 0
  }
}
