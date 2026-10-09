type Entry = {
  texture: GPUTexture
  group: GPUBindGroup
  uniform: GPUBuffer
  width: number
  height: number
  bytes: number
  valid: boolean
  seen: boolean
  pending: boolean
}

export type BackdropOutput = Readonly<{
  texture: GPUTexture
  group: GPUBindGroup
  hit: boolean
}>

/**
 * Ограниченный cache конечного blur-выхода; source, uniform и sampler заимствованы.
 *
 * reusable подтверждает точное равенство всех входов операции у вызывающего owner.
 * После miss owner записывает V-выход, затем вызывает endFrame только после submission.
 * Повторный beginFrame отменяет pending предыдущего незавершённого кадра.
 */
export class BackdropOutputCache {
  readonly #operations = new Map<object, Map<object, Entry>>()
  readonly #bytesPerPixel: number
  #bytes = 0
  #active = false
  #disposed = false

  constructor(
    readonly device: GPUDevice,
    readonly format: GPUTextureFormat,
    readonly compositeLayout: GPUBindGroupLayout,
    readonly sampler: GPUSampler,
    readonly maxBytes = 32 * 1024 * 1024,
  ) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new RangeError("Backdrop output budget must be a non-negative safe integer")
    this.#bytesPerPixel = colorBytesPerPixel(format)
  }

  beginFrame(): void {
    this.#assertLive()
    this.#active = true
    for (const targets of this.#operations.values()) for (const entry of targets.values()) {
      entry.seen = false
      entry.pending = false
    }
  }

  acquire(operationKey: object, targetKey: object, sizeUniform: GPUBuffer, width: number, height: number, reusable: boolean): BackdropOutput | null {
    this.#assertLive()
    if (!this.#active) throw new Error("Backdrop output acquire requires beginFrame")
    if (![width, height].every(value => Number.isSafeInteger(value) && value > 0)) throw new RangeError("Backdrop output dimensions must be positive safe integers")
    const bytes = width * height * this.#bytesPerPixel
    if (!Number.isSafeInteger(bytes)) throw new RangeError("Backdrop output size exceeds safe integer range")
    const targets = this.#operations.get(operationKey)
    const previous = targets?.get(targetKey)
    const sameDimensions = previous?.width === width && previous.height === height
    if (previous?.seen && (!sameDimensions || previous.uniform !== sizeUniform)) {
      throw new Error("Backdrop output cannot be replaced after use in the current frame")
    }
    if (previous && sameDimensions) {
      // Создание binding может бросить: прежний valid output тогда сохраняется.
      const group = previous.uniform === sizeUniform ? previous.group : this.#group(previous.texture, sizeUniform)
      const hit = previous.valid && reusable && previous.uniform === sizeUniform
      previous.group = group
      previous.uniform = sizeUniform
      previous.seen = true
      if (!hit) {
        previous.valid = false
        previous.pending = true
      }
      return {texture: previous.texture, group, hit}
    }
    // Старый output сохраняется до успешного выделения; peak тоже входит в budget.
    if (bytes > this.maxBytes - this.#bytes) return null
    let texture: GPUTexture | undefined
    let group: GPUBindGroup
    try {
      texture = this.device.createTexture({label: "backdrop-cached-output", size: [width, height], format: this.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT})
      group = this.#group(texture, sizeUniform)
    } catch (error) {
      texture?.destroy()
      throw error
    }
    const entry: Entry = {texture, group, uniform: sizeUniform, width, height, bytes, valid: false, seen: true, pending: true}
    if (previous) this.#destroy(previous)
    if (targets) targets.set(targetKey, entry)
    else this.#operations.set(operationKey, new Map([[targetKey, entry]]))
    this.#bytes += bytes
    return {texture, group, hit: false}
  }

  /** Подтверждает только записанные outputs уже отправленного command buffer. */
  endFrame(): void {
    this.#assertLive()
    if (!this.#active) return
    for (const [operation, targets] of this.#operations) {
      for (const [target, entry] of targets) {
        if (!entry.seen) {
          this.#destroy(entry)
          targets.delete(target)
        } else if (entry.pending) {
          entry.valid = true
          entry.pending = false
        }
      }
      if (targets.size === 0) this.#operations.delete(operation)
    }
    this.#active = false
  }

  releaseTarget(targetKey: object): void {
    this.#assertLive()
    // Проверка всех операций предшествует удалению хотя бы одного output.
    if (this.#active && [...this.#operations.values()].some(targets => targets.get(targetKey)?.seen)) {
      throw new Error("Backdrop target is in use by the current unsubmitted frame")
    }
    for (const [operation, targets] of this.#operations) {
      const entry = targets.get(targetKey)
      if (entry) {
        this.#destroy(entry)
        targets.delete(targetKey)
      }
      if (targets.size === 0) this.#operations.delete(operation)
    }
  }

  dispose(): void {
    if (this.#disposed) return
    for (const targets of this.#operations.values()) for (const entry of targets.values()) this.#destroy(entry)
    this.#operations.clear()
    this.#active = false
    this.#disposed = true
  }

  #group(texture: GPUTexture, uniform: GPUBuffer): GPUBindGroup {
    return this.device.createBindGroup({layout: this.compositeLayout, entries: [
      {binding: 0, resource: texture.createView()}, {binding: 1, resource: this.sampler}, {binding: 2, resource: {buffer: uniform}},
    ]})
  }

  #destroy(entry: Entry): void {
    entry.texture.destroy()
    this.#bytes -= entry.bytes
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error("Backdrop output cache is disposed")
  }
}

function colorBytesPerPixel(format: GPUTextureFormat): number {
  if (format.startsWith("bgra8") || ["rgb10a2unorm", "rgb10a2uint", "rg11b10ufloat", "rgb9e5ufloat"].includes(format)) return 4
  const match = /^(r|rg|rgba)(8|16|32)(?:uint|sint|float|unorm|snorm|unorm-srgb)$/u.exec(format)
  if (!match) throw new RangeError(`Unsupported backdrop output color format: ${format}`)
  return ({r: 1, rg: 2, rgba: 4}[match[1]!]!) * Number(match[2]) / 8
}
