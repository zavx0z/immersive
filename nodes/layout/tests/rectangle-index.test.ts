import {expect, test} from "bun:test"
import {createRectangleIndex} from "@zavx0z/immersive-nodes-layout/rectangle-index"
import type {LayoutNodeGeometry, LayoutRectangle} from "@zavx0z/immersive-nodes-layout/types"

test("пустой индекс, касание границы, отрицательные координаты и точечный запрос", () => {
  expect(createRectangleIndex([]).query({x: 0, y: 0, width: 0, height: 0})).toEqual({ids: [], truncated: false})
  const index = createRectangleIndex([{id: "a", x: -10, y: -20, width: 30, height: 40}])
  expect(index.size).toBe(1)
  expect(index.query({x: 20, y: 20, width: 0, height: 0})).toEqual({ids: ["a"], truncated: false})
  expect(index.query({x: 21, y: 20, width: 0, height: 0})).toEqual({ids: [], truncated: false})
})

test("неравномерная геометрия совпадает с полным пересечением AABB", () => {
  const rectangles: LayoutNodeGeometry[] = Array.from({length: 2_000}, (_, index) => ({
    id: String(index),
    x: index * 137 % 10_001 - 5_000,
    y: index * 173 % 8_003 - 4_000,
    width: 10 + index * 17 % 300,
    height: 10 + index * 19 % 400,
  }))
  const index = createRectangleIndex(rectangles)
  for (let n = 0; n < 60; n++) {
    const bounds = {x: n * 337 % 11_003 - 5_500, y: n * 557 % 9_001 - 4_500, width: 500, height: 600}
    const result = index.query(bounds, {limit: rectangles.length})
    expect([...result.ids].sort()).toEqual(rectangles.filter(rect => intersects(rect, bounds)).map(rect => rect.id).sort())
    expect(result.truncated).toBe(false)
  }
})

test("лимит ограничивает выдачу и truncated точно указывает оставшиеся пересечения", () => {
  const rectangles = Array.from({length: 1_005}, (_, index) => ({id: String(index), x: 0, y: 0, width: 10, height: 10}))
  const index = createRectangleIndex(rectangles)
  const viewport = {x: 0, y: 0, width: 10, height: 10}
  expect(index.query(viewport).ids).toHaveLength(1_000)
  expect(index.query(viewport).truncated).toBe(true)
  expect(index.query(viewport, {limit: 1_005}).truncated).toBe(false)
  const bounded = index.query(viewport, {limit: 3})
  expect(bounded.ids).toHaveLength(3)
  expect(bounded.truncated).toBe(true)
  expect(createRectangleIndex([...rectangles].reverse()).query(viewport, {limit: 3})).toEqual(bounded)
})

test("копия прямоугольников не зависит от последующего изменения массива", () => {
  const rectangles = [{id: "a", x: 0, y: 0, width: 10, height: 10}]
  const index = createRectangleIndex(rectangles)
  rectangles[0]!.x = 1_000
  rectangles.length = 0
  expect(index.query({x: 0, y: 0, width: 10, height: 10})).toEqual({ids: ["a"], truncated: false})
})

test("100000 прямоугольников индексируются без рекурсии и возвращают ограниченный рабочий набор", () => {
  const index = createRectangleIndex(Array.from({length: 100_000}, (_, n) => ({
    id: String(n), x: n % 1_000 * 100, y: Math.floor(n / 1_000) * 100, width: 80, height: 80,
  })))
  expect(index.size).toBe(100_000)
  const result = index.query({x: 10_001, y: 2_001, width: 79, height: 79}, {limit: 10})
  expect(result).toEqual({ids: ["20100"], truncated: false})
})

test("невалидные размеры, переполнение, дубликаты и неограниченный limit отклоняются", () => {
  const valid = {id: "a", x: 0, y: 0, width: 10, height: 10}
  for (const field of ["x", "y", "width", "height"] as const) {
    expect(() => createRectangleIndex([{...valid, [field]: Infinity}])).toThrow(RangeError)
    expect(() => createRectangleIndex([{...valid, [field]: NaN}])).toThrow(RangeError)
  }
  expect(() => createRectangleIndex([{...valid, x: Number.MAX_VALUE, width: Number.MAX_VALUE}])).toThrow(RangeError)
  expect(() => createRectangleIndex([{...valid, width: 0}])).toThrow(RangeError)
  expect(() => createRectangleIndex([valid, valid])).toThrow("duplicate rectangle")
  const index = createRectangleIndex([valid])
  for (const limit of [0, -1, 1.5, Infinity, NaN]) {
    expect(() => index.query(valid, {limit})).toThrow(RangeError)
  }
  expect(() => index.query({...valid, width: -1})).toThrow(RangeError)
})

function intersects(a: LayoutRectangle, b: LayoutRectangle): boolean {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
}
