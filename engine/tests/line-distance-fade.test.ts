import {expect, test} from "bun:test"
import {BufferGeometry, Color, LineBasicMaterial, LineGlowMaterial, WireframeInstancedMesh} from "../src/index.ts"

test("материал явно управляет дистанцией затухания; 0 сохраняет стабильный цвет", () => {
  expect(new LineBasicMaterial().distanceFade).toBe(5000)
  expect(new LineGlowMaterial().distanceFade).toBe(5000)
  const material = new LineBasicMaterial({distanceFade: 0, color: 0x94a3b8, opacity: .75})
  expect(material.distanceFade).toBe(0)
  expect(material.opacity).toBe(.75)
  material.distanceFade = 12000
  expect(material.distanceFade).toBe(12000)
  const glow = new LineGlowMaterial({distanceFade: 0, glowIntensity: 2})
  expect(glow.distanceFade).toBe(0)
  expect(glow.glowIntensity).toBe(2)
})

test("некорректное расстояние не заменяет действующее значение материала", () => {
  const material = new LineBasicMaterial({distanceFade: 5000})
  for (const value of [-1, NaN, Infinity, Number.MIN_VALUE]) {
    expect(() => { material.distanceFade = value }).toThrow(RangeError)
    expect(material.distanceFade).toBe(5000)
  }
})


test("instanced wireframe сохраняет отдельное затухание каждого материала", () => {
  const stable = new LineGlowMaterial({distanceFade: 0, color: 0xff0000})
  const faded = new LineGlowMaterial({distanceFade: 5000, color: 0x0000ff})
  const geometry = new BufferGeometry()
  const mesh = new WireframeInstancedMesh(geometry, [stable, faded], 2)
  const attribute = geometry.attributes.instanceBuffer!
  expect(attribute.itemSize).toBe(26)
  expect(attribute.array[25]).toBe(0)
  expect(attribute.array[51]).toBe(Math.fround(1 / 5000))
  mesh.setColorAt(1, new Color(0x00ff00))
  mesh.setGlowIntensityAt(1, 4)
  mesh.update()
  expect(Array.from(attribute.array.slice(42, 47))).toEqual([0, 1, 0, 1, 4])
  expect(attribute.array[51]).toBe(Math.fround(1 / 5000))
  mesh.setMaterialAt(1, stable)
  mesh.update()
  expect(attribute.array[51]).toBe(0)
  expect(attribute).toBe(geometry.attributes.instanceBuffer!)
})
