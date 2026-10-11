/** The draw commands shared by a render pass and a render bundle. */
export interface RenderCommandEncoder {
  setPipeline(pipeline: GPURenderPipeline): void
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: readonly number[]): void
  setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number, size?: number): void
  setIndexBuffer(buffer: GPUBuffer, format: GPUIndexFormat, offset?: number, size?: number): void
  draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void
  drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void
}

export type RenderBundleLayout = Readonly<{
  colorFormat: GPUTextureFormat
  depthStencilFormat?: GPUTextureFormat
  additionalColorFormats?: readonly GPUTextureFormat[]
  sampleCount: number
  depthReadOnly?: boolean
  stencilReadOnly?: boolean
}>

type Token = number | string | GPUBuffer | GPUBindGroup | GPURenderPipeline | undefined

const PIPELINE = 0
const BIND_GROUP = 1
const VERTEX_BUFFER = 2
const INDEX_BUFFER = 3
const DRAW = 4
const DRAW_INDEXED = 5
const MAX_RETAINED_TOKENS = 131072
const MAX_RETAINED_SEGMENTS = 64

type Segment = {tokens: Token[], cursor: number, changed: boolean, recorded: boolean, bundle: GPURenderBundle | null}
const createSegment = (): Segment => ({tokens: [], cursor: 0, changed: false, recorded: false, bundle: null})

/**
 * Retains exact static command runs, never pixels or transient resources.
 *
 * The caller still synchronizes resources and records every live draw. Numeric
 * arguments are copied into a reusable tape; GPU objects compare by identity.
 * A changed sequence is encoded directly. Only a second consecutive identical
 * sequence is promoted to a bundle, so moving layers do not allocate throwaway
 * bundles. Buffer content writes keep a stable sequence reusable. A hard tape
 * limit switches to direct encoding without losing the recorded prefix.
 * Transient draws split the sequence without changing paint order or adding
 * render passes; every retained run has independent, complete GPU bindings.
 */
export class RenderBundleCache implements RenderCommandEncoder {
  private segments: Segment[] = [createSegment()]
  private segment = this.segments[0]!
  private segmentIndex = 0
  private retainedTokens = 0
  private device: GPUDevice | null = null
  private layout: RenderBundleLayout | null = null
  private pass: GPURenderPassEncoder | null = null
  private direct: GPURenderPassEncoder | null = null

  constructor(private readonly maxTokens = MAX_RETAINED_TOKENS) {}

  execute(
    device: GPUDevice,
    layout: RenderBundleLayout,
    pass: GPURenderPassEncoder,
    record: (encoder: RenderCommandEncoder) => void,
  ): void {
    if (this.pass !== null) throw new Error("Render bundle recording is already active")
    if (
      this.device !== device
      || this.layout?.colorFormat !== layout.colorFormat
      || this.layout.depthStencilFormat !== layout.depthStencilFormat
      || (this.layout.additionalColorFormats ?? []).join() !== (layout.additionalColorFormats ?? []).join()
      || this.layout.sampleCount !== layout.sampleCount
      || this.layout.depthReadOnly !== layout.depthReadOnly
      || this.layout.stencilReadOnly !== layout.stencilReadOnly
    ) {
      this.clear()
      this.device = device
      this.layout = {...layout, ...(layout.additionalColorFormats === undefined ? {} : {additionalColorFormats: [...layout.additionalColorFormats]})}
    }
    this.segmentIndex = 0
    this.retainedTokens = 0
    this.segment = this.segments[0]!
    this.segment.cursor = 0
    this.segment.changed = false
    this.pass = pass
    this.direct = null
    try {
      record(this)
      if (this.direct !== null) return
      this.finishSegment()
      this.segments.length = this.segmentIndex + 1
    } catch (error) {
      // A failed recording may already have changed the tape. It must never
      // compare equal to the previously finished bundle on a later retry.
      this.clear()
      throw error
    } finally {
      this.pass = null
      this.direct = null
    }
  }

  clear(): void {
    this.segments = [createSegment()]
    this.segment = this.segments[0]!
    this.device = null
    this.layout = null
  }

  /**
   * Encodes a draw using submission-scoped resources between retained runs.
   * Both callbacks must establish their own required GPU state: executeBundles
   * clears pass bindings. Transient resources never enter a retained tape.
   */
  transient(record: (encoder: RenderCommandEncoder) => void, resume: (encoder: RenderCommandEncoder) => void): void {
    if (this.pass === null) throw new Error("Render bundle recording is not active")
    if (this.direct === null) {
      this.finishSegment()
      this.retainedTokens += this.segment.cursor
      if (this.retainedTokens >= this.maxTokens || this.segmentIndex + 1 >= MAX_RETAINED_SEGMENTS) {
        this.direct = this.pass
        this.clear()
      } else {
        this.segmentIndex++
        this.segment = this.segments[this.segmentIndex] ??= createSegment()
        this.segment.cursor = 0
        this.segment.changed = false
      }
    }
    record(this.pass)
    resume(this)
  }

  private finishSegment(): void {
    const segment = this.segment
    if (segment.tokens.length !== segment.cursor) segment.changed = true
    segment.tokens.length = segment.cursor
    if (!segment.recorded || segment.changed) {
      segment.bundle = null
      segment.recorded = true
      this.replay(this.pass!, segment.cursor)
      return
    }
    if (segment.bundle === null) {
      const layout = this.layout!
      const encoder = this.device!.createRenderBundleEncoder({
        colorFormats: [layout.colorFormat, ...layout.additionalColorFormats ?? []],
        ...(layout.depthStencilFormat === undefined ? {} : {depthStencilFormat: layout.depthStencilFormat}),
        sampleCount: layout.sampleCount,
        depthReadOnly: layout.depthReadOnly ?? false,
        stencilReadOnly: layout.stencilReadOnly ?? false,
      })
      this.replay(encoder, segment.cursor)
      segment.bundle = encoder.finish()
    }
    this.pass!.executeBundles([segment.bundle])
  }

  setPipeline(pipeline: GPURenderPipeline): void {
    if (!this.reserve(2)) return this.direct!.setPipeline(pipeline)
    this.write(PIPELINE)
    this.write(pipeline)
  }

  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets: readonly number[] = []): void {
    if (!this.reserve(4 + dynamicOffsets.length)) {
      return this.direct!.setBindGroup(index, bindGroup, dynamicOffsets)
    }
    this.write(BIND_GROUP)
    this.write(index)
    this.write(bindGroup)
    this.write(dynamicOffsets.length)
    for (const offset of dynamicOffsets) this.write(offset)
  }

  setVertexBuffer(slot: number, buffer: GPUBuffer, offset = 0, size?: number): void {
    if (!this.reserve(5)) return this.direct!.setVertexBuffer(slot, buffer, offset, size)
    this.write(VERTEX_BUFFER)
    this.write(slot)
    this.write(buffer)
    this.write(offset)
    this.write(size)
  }

  setIndexBuffer(buffer: GPUBuffer, format: GPUIndexFormat, offset = 0, size?: number): void {
    if (!this.reserve(5)) return this.direct!.setIndexBuffer(buffer, format, offset, size)
    this.write(INDEX_BUFFER)
    this.write(buffer)
    this.write(format)
    this.write(offset)
    this.write(size)
  }

  draw(vertexCount: number, instanceCount = 1, firstVertex = 0, firstInstance = 0): void {
    if (!this.reserve(5)) return this.direct!.draw(vertexCount, instanceCount, firstVertex, firstInstance)
    this.write(DRAW)
    this.write(vertexCount)
    this.write(instanceCount)
    this.write(firstVertex)
    this.write(firstInstance)
  }

  drawIndexed(indexCount: number, instanceCount = 1, firstIndex = 0, baseVertex = 0, firstInstance = 0): void {
    if (!this.reserve(6)) return this.direct!.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance)
    this.write(DRAW_INDEXED)
    this.write(indexCount)
    this.write(instanceCount)
    this.write(firstIndex)
    this.write(baseVertex)
    this.write(firstInstance)
  }

  private reserve(count: number): boolean {
    if (this.direct !== null) return false
    if (this.retainedTokens + this.segment.cursor + count <= this.maxTokens) return true
    this.direct = this.pass!
    this.replay(this.direct, this.segment.cursor)
    this.clear()
    return false
  }

  private write(value: Token): void {
    if (!Object.is(this.segment.tokens[this.segment.cursor], value)) this.segment.changed = true
    this.segment.tokens[this.segment.cursor++] = value
  }

  private replay(encoder: RenderCommandEncoder, length: number): void {
    const tokens = this.segment.tokens
    let cursor = 0
    while (cursor < length) {
      switch (tokens[cursor++]) {
        case PIPELINE:
          encoder.setPipeline(tokens[cursor++] as GPURenderPipeline)
          break
        case BIND_GROUP: {
          const index = tokens[cursor++] as number
          const bindGroup = tokens[cursor++] as GPUBindGroup
          const count = tokens[cursor++] as number
          const offsets = tokens.slice(cursor, cursor + count) as number[]
          cursor += count
          encoder.setBindGroup(index, bindGroup, offsets)
          break
        }
        case VERTEX_BUFFER:
          encoder.setVertexBuffer(
            tokens[cursor++] as number,
            tokens[cursor++] as GPUBuffer,
            tokens[cursor++] as number,
            tokens[cursor++] as number | undefined,
          )
          break
        case INDEX_BUFFER:
          encoder.setIndexBuffer(
            tokens[cursor++] as GPUBuffer,
            tokens[cursor++] as GPUIndexFormat,
            tokens[cursor++] as number,
            tokens[cursor++] as number | undefined,
          )
          break
        case DRAW:
          encoder.draw(
            tokens[cursor++] as number,
            tokens[cursor++] as number,
            tokens[cursor++] as number,
            tokens[cursor++] as number,
          )
          break
        case DRAW_INDEXED:
          encoder.drawIndexed(
            tokens[cursor++] as number,
            tokens[cursor++] as number,
            tokens[cursor++] as number,
            tokens[cursor++] as number,
            tokens[cursor++] as number,
          )
          break
        default:
          throw new Error("Invalid retained render command")
      }
    }
  }
}
