import {expect, test} from "bun:test"
import {Color, RoundedRectMaterial, RoundedRectInstanceLayer, ROUNDED_RECT_INSTANCE_RECORD_BYTE_LENGTH} from "../src/index.ts"

test("цвета сторон material сохраняют RGBA и порядок top/right/bottom/left независимо от caller", () => {
  const top = new Color(0.123456789, 0.234567891, 0.345678912, 0.456789123)
  const colors = [top, 0x00ff00, new Color(0, 0, 1, 0), 0xffff00] as const
  const material = new RoundedRectMaterial({width: 80, height: 40, radius: 12, borderColors: colors})
  expect(material.borderColors?.map(color => [...color.toArray()])).toEqual([
    [...top.toArray()], [0, 1, 0, 1], [0, 0, 1, 0], [1, 1, 0, 1],
  ])
  expect(material.borderColors?.[0]).not.toBe(top)
  const retained = material.borderColors?.[0]!.toArray()
  top.setRGBA(1, 1, 1, 1)
  expect(material.borderColors?.[0]!.toArray()).toEqual(retained)
  expect(material.border.a).toBe(0)
})

test("одноцветный material и rounded layer не выделяют палитру и сохраняют ABI 128 B", () => {
  const material = new RoundedRectMaterial({width: 80, height: 40, radius: 12, border: 0x123456, borderWidth: 4})
  expect(material.borderColors).toBeNull()
  expect(material.border.toArray()).toEqual(new Color(0x123456).toArray())
  expect(material.borderWidths).toEqual([4, 4, 4, 4])
  const layer = new RoundedRectInstanceLayer({initialCapacity: 2, maxCapacity: 8})
  expect(ROUNDED_RECT_INSTANCE_RECORD_BYTE_LENGTH).toBe(128)
  expect(layer.instances.recordByteLength).toBe(128)
  expect(layer.geometry.attributes.roundedRectBorderColors).toBeUndefined()
  expect(layer.geometry.attributes.position?.count).toBe(4)
  expect(layer.geometry.index?.count).toBe(6)
})


test("одноцветный pipeline возвращается после очистки цвета и освобождения последнего цветного slot", () => {
  const layer = new RoundedRectInstanceLayer({initialCapacity: 2, maxCapacity: 8})
  const record = new Float32Array(32)
  const first = layer.instances.allocate(record)
  const second = layer.instances.allocate(record)
  const colors = [new Color(0xff0000), new Color(0x00ff00), new Color(0x0000ff), new Color(0xffff00)]
  expect(layer.hasBorderColors).toBeFalse()
  layer.setBorderColors(first, colors)
  const palette = layer.geometry.attributes.roundedRectBorderColors
  expect(layer.hasBorderColors).toBeTrue()
  layer.setBorderColors(first, null)
  expect(layer.hasBorderColors).toBeFalse()
  expect(layer.geometry.attributes.roundedRectBorderColors).toBe(palette)
  layer.setBorderColors(second, colors)
  expect(layer.hasBorderColors).toBeTrue()
  layer.instances.remove(second)
  expect(layer.hasBorderColors).toBeFalse()
  const reused = layer.instances.allocate(record)
  expect(reused.slot).toBe(second.slot)
  expect(layer.hasBorderColors).toBeFalse()
  layer.setBorderColors(reused, colors)
  expect(layer.hasBorderColors).toBeTrue()
  layer.instances.clear()
  expect(layer.hasBorderColors).toBeFalse()
})
