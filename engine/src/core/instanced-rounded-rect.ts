import {BufferAttribute, BufferGeometry} from "./buffer-geometry"
import type {Color} from "../math"
import type {InstanceHandle} from "./instance-layer"
import {InstanceLayer} from "./instance-layer"
import {Object3D} from "./object-3d"

/** Eight storage-aligned vec4 values consumed by the rounded-rect pipeline. */
export const ROUNDED_RECT_INSTANCE_RECORD_FLOATS = 32
export const ROUNDED_RECT_INSTANCE_RECORD_BYTE_LENGTH =
  ROUNDED_RECT_INSTANCE_RECORD_FLOATS * Float32Array.BYTES_PER_ELEMENT

/** Stable float offsets for the renderer-owned packed record ABI. */
export const ROUNDED_RECT_INSTANCE_OFFSETS = Object.freeze({
  rect: 0,
  transform: 4,
  fill: 8,
  border: 12,
  radii: 16,
  borderWidths: 20,
  params: 24,
  reserved: 28, // x = 1: независимые Float32 RGBA из ленивой палитры слота
} as const)

export interface RoundedRectInstanceLayerOptions {
  readonly initialCapacity?: number
  readonly maxCapacity: number
}

/**
 * Engine-owned GPU presentation storage shared by one or more retained runs.
 *
 * The record payload remains opaque bytes at the generic {@link InstanceLayer}
 * boundary. The rounded-rect pipeline owns only its fixed stride and shader
 * interpretation. Physical records stay stable while the separate order
 * attribute changes.
 */
export class RoundedRectInstanceLayer {
  public readonly isRoundedRectInstanceLayer: true = true
  public readonly instances: InstanceLayer
  public readonly geometry: BufferGeometry
  readonly #borderColorHandles = new Set<InstanceHandle>()
  #borderColorOwnershipVersion = -1

  /** Активные цвета выбирают pipeline независимо от сохранённой ёмкости палитры. */
  public get hasBorderColors(): boolean {
    if (this.#borderColorHandles.size === 0) return false
    if (this.#borderColorOwnershipVersion !== this.instances.ownershipVersion) {
      for (const handle of this.#borderColorHandles) {
        if (!this.instances.has(handle)) this.#borderColorHandles.delete(handle)
      }
      this.#borderColorOwnershipVersion = this.instances.ownershipVersion
    }
    return this.#borderColorHandles.size > 0
  }

  public constructor(options: RoundedRectInstanceLayerOptions) {
    const instanceOptions = {
      recordByteLength: ROUNDED_RECT_INSTANCE_RECORD_BYTE_LENGTH,
      maxCapacity: options.maxCapacity,
      ...(options.initialCapacity === undefined ? {} : {initialCapacity: options.initialCapacity}),
    }
    this.instances = new InstanceLayer(instanceOptions)

    const geometry = new BufferGeometry()
    geometry.setAttribute("position", new BufferAttribute(new Float32Array([
      -0.5, 0.5, 0,
      0.5, 0.5, 0,
      -0.5, -0.5, 0,
      0.5, -0.5, 0,
    ]), 3))
    geometry.setIndex(new BufferAttribute(new Uint16Array([
      0, 2, 1,
      2, 3, 1,
    ]), 1))
    geometry.setAttribute("roundedRectRecords", this.instances.recordAttribute)
    geometry.setAttribute("roundedRectOrder", this.instances.orderAttribute)
    this.geometry = geometry
  }

  /**
   * Дополнительные RGBA только для разноцветных рамок. Обычные записи остаются 128 B.
   * Палитра адресуется стабильным physical slot; порядок рисования её не перемещает.
   */
  public setBorderColors(handle: InstanceHandle, colors: readonly Color[] | null): void {
    if (!this.instances.has(handle)) throw new Error("Border palette requires a live instance")
    if (colors === null) {
      this.#borderColorHandles.delete(handle)
      return
    }
    if (colors.length !== 4) throw new TypeError("Border palette requires four RGBA colors")
    const required = handle.slot + 1
    let attribute = this.geometry.attributes.roundedRectBorderColors
    if (attribute === undefined) {
      attribute = new BufferAttribute(new Float32Array(Math.min(this.instances.maxCapacity, Math.max(16, required)) * 16), 16)
      this.geometry.setAttribute("roundedRectBorderColors", attribute)
    } else if (attribute.count < required) {
      const next = new Float32Array(Math.min(this.instances.maxCapacity, Math.max(required, attribute.count * 2)) * 16)
      next.set(attribute.array)
      attribute.array = next
    }
    const data = attribute.array as Float32Array
    const offset = handle.slot * 16
    let changed = false
    for (let side = 0; side < 4; side++) {
      const color = colors[side]!
      const values = [color.r, color.g, color.b, color.a]
      for (let channel = 0; channel < 4; channel++) {
        const index = offset + side * 4 + channel
        const value = Math.fround(values[channel]!)
        if (data[index] !== value) {data[index] = value; changed = true}
      }
    }
    if (changed) attribute.addUpdateRange(offset, 16)
    this.#borderColorHandles.add(handle)
    this.#borderColorOwnershipVersion = -1
  }
}

/**
 * One draw-range view over a {@link RoundedRectInstanceLayer}.
 *
 * Several views may share one layer so scalar barriers can remain between
 * consecutive instanced runs without duplicating records or unit-quad data.
 */
export class InstancedRoundedRect extends Object3D {
  public readonly isInstancedRoundedRect: true = true
  public readonly layer: RoundedRectInstanceLayer
  public firstInstance = 0
  public count = 0

  public constructor(
    layer: RoundedRectInstanceLayer,
    firstInstance = 0,
    count = layer.instances.count,
  ) {
    super()
    this.layer = layer
    this.renderLayer = "ui"
    this.frustumCulled = false
    this.setRange(firstInstance, count)
  }

  public get geometry(): BufferGeometry {
    return this.layer.geometry
  }

  public setRange(firstInstance: number, count: number): this {
    if (!Number.isInteger(firstInstance) || firstInstance < 0) {
      throw new RangeError(`InstancedRoundedRect firstInstance must be a non-negative integer, received ${firstInstance}`)
    }
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(`InstancedRoundedRect count must be a non-negative integer, received ${count}`)
    }
    if (firstInstance + count > this.layer.instances.count) {
      throw new RangeError(
        `InstancedRoundedRect range [${firstInstance}, ${firstInstance + count}) exceeds layer count ${this.layer.instances.count}`,
      )
    }
    this.firstInstance = firstInstance
    this.count = count
    return this
  }
}
