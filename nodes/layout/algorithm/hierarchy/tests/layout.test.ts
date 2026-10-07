import {expect, test} from "bun:test"
import {
  HierarchyLayoutError,
  layoutHierarchy,
  type HierarchyLayoutInput,
  type HierarchyLayoutOutput,
} from "@zavx0z/immersive-nodes-layout/hierarchy"

test("пустой лес и один корень сохраняют точные bounds", () => {
  expect(layoutHierarchy({nodes: []})).toEqual({
    direction: "DOWN",
    bounds: {x: 0, y: 0, width: 0, height: 0},
    nodes: [],
    edges: [],
  })
  expect(layoutHierarchy({nodes: [{id: "root", width: 210, height: 65}]})).toEqual({
    direction: "DOWN",
    bounds: {x: 0, y: 0, width: 210, height: 65},
    nodes: [{id: "root", x: 0, y: 0, width: 210, height: 65}],
    edges: [],
  })
})

test("размеры, порядок детей, общий слой и маршруты сохраняются при произвольном порядке родителей", () => {
  const input: HierarchyLayoutInput = {
    nodes: [
      {id: "first", parentId: "root", width: 40, height: 20},
      {id: "second", parentId: "root", width: 80, height: 50},
      {id: "leaf", parentId: "first", width: 60, height: 35},
      {id: "root", width: 100, height: 30},
      {id: "other", width: 25, height: 70},
    ],
    options: {siblingSpacing: 10, layerSpacing: 20},
  }
  const result = layoutHierarchy(input)
  expect(result.nodes).toEqual([
    {id: "first", x: 10, y: 90, width: 40, height: 20},
    {id: "second", x: 70, y: 90, width: 80, height: 50},
    {id: "leaf", x: 0, y: 160, width: 60, height: 35},
    {id: "root", x: 25, y: 0, width: 100, height: 30},
    {id: "other", x: 160, y: 0, width: 25, height: 70},
  ])
  expect(result.bounds).toEqual({x: 0, y: 0, width: 185, height: 195})
  expect(result.edges[0]).toEqual({
    id: "hierarchy:0",
    sourceNodeId: "root",
    targetNodeId: "first",
    sections: [{
      startPoint: {x: 75, y: 30},
      bendPoints: [{x: 75, y: 80}, {x: 30, y: 80}],
      endPoint: {x: 30, y: 90},
    }],
  })
  expect(result.edges[2]!.sections[0].bendPoints).toEqual([])
  checkGeometry(result, input)
})

test("широкий родитель центрирует детей, нулевые расстояния допускают касание границ", () => {
  const input: HierarchyLayoutInput = {
    nodes: [
      {id: "root", width: 300, height: 40},
      {id: "a", parentId: "root", width: 40, height: 20},
      {id: "b", parentId: "root", width: 60, height: 25},
    ],
    options: {siblingSpacing: 0, layerSpacing: 0},
  }
  const result = layoutHierarchy(input)
  expect(result.nodes[1]!.x).toBe(100)
  expect(result.nodes[2]!.x).toBe(140)
  expect(result.bounds).toEqual({x: 0, y: 0, width: 300, height: 65})
  checkGeometry(result, input)
})

test("дробные размеры не округляются, frozen вход не меняется, результат детерминирован", () => {
  const input = Object.freeze({
    nodes: Object.freeze([
      Object.freeze({id: "root", width: 2.75, height: 1.25}),
      Object.freeze({id: "child", parentId: "root", width: 1.5, height: 3.5}),
    ]),
    options: Object.freeze({siblingSpacing: 0.25, layerSpacing: 0.5}),
  })
  const first = layoutHierarchy(input)
  expect(first.nodes[1]).toEqual({id: "child", x: 0.625, y: 1.75, width: 1.5, height: 3.5})
  expect(first.bounds).toEqual({x: 0, y: 0, width: 2.75, height: 5.25})
  expect(JSON.stringify(layoutHierarchy(input))).toBe(JSON.stringify(first))
  expect(first).not.toHaveProperty("viewport")
})

test("отказы указывают дубликат, неизвестного родителя и точный цикл без ведущего хвоста", () => {
  const node = (id: string, parentId?: string) => ({id, width: 20, height: 20, ...parentId === undefined ? {} : {parentId}})
  expectError({nodes: [node("a"), node("a")]}, "DUPLICATE_NODE", ["a"])
  expectError({nodes: [node("a", "missing")]}, "UNKNOWN_PARENT", ["a", "missing"])
  expectError({nodes: [node("a", "a")]}, "CYCLE_DETECTED", ["a", "a"])
  expectError({nodes: [node("tail", "a"), node("root"), node("a", "b"), node("b", "c"), node("c", "a")]}, "CYCLE_DETECTED", ["a", "b", "c", "a"])
})

test("неконечные, отрицательные, нулевые размеры и переполнение отклоняются", () => {
  for (const value of [NaN, Infinity, -Infinity, -1, 0]) {
    for (const field of ["width", "height"] as const) {
      expectError({nodes: [{id: "a", width: 20, height: 30, [field]: value}]}, "INVALID_GEOMETRY", ["a"], field)
    }
  }
  for (const value of [NaN, Infinity, -1]) {
    for (const field of ["siblingSpacing", "layerSpacing"] as const) {
      expectError({nodes: [], options: {[field]: value}}, "INVALID_GEOMETRY", [], field)
    }
  }
  expectError({nodes: [
    {id: "root", width: 20, height: 20},
    {id: "a", parentId: "root", width: Number.MAX_VALUE, height: 20},
    {id: "b", parentId: "root", width: Number.MAX_VALUE, height: 20},
  ]}, "INVALID_GEOMETRY", ["root"], "subtreeWidth")
  expectError({nodes: [
    {id: "root", width: 20, height: Number.MAX_VALUE},
    {id: "a", parentId: "root", width: 20, height: Number.MAX_VALUE},
  ]}, "INVALID_GEOMETRY", [], "height")
  expectError({nodes: [
    {id: "a", width: Number.MAX_VALUE, height: 20},
    {id: "b", width: Number.MAX_VALUE, height: 20},
  ]}, "INVALID_GEOMETRY", ["b"], "width")
  expect(layoutHierarchy({
    nodes: [{id: "only", width: 10, height: 10}],
    options: {siblingSpacing: Number.MAX_VALUE, layerSpacing: Number.MAX_VALUE},
  }).bounds).toEqual({x: 0, y: 0, width: 10, height: 10})
})

test("20000 уровней и 20000 детей раскладываются без рекурсивного стека", () => {
  const count = 20_000
  const chain: HierarchyLayoutInput = {
    nodes: Array.from({length: count}, (_, index) => ({
      id: String(index),
      ...index === 0 ? {} : {parentId: String(index - 1)},
      width: 16 + index % 5,
      height: 10 + index % 3,
    })),
  }
  const deep = layoutHierarchy(chain)
  expect(deep.nodes).toHaveLength(count)
  expect(deep.edges).toHaveLength(count - 1)
  expect(deep.bounds.width).toBe(20)
  checkGeometry(deep, chain)

  const wide: HierarchyLayoutInput = {
    nodes: [
      {id: "root", width: 100, height: 20},
      ...Array.from({length: count}, (_, index) => ({id: String(index), parentId: "root", width: 30, height: 15})),
    ],
  }
  const broad = layoutHierarchy(wide)
  expect(broad.nodes).toHaveLength(count + 1)
  expect(broad.edges).toHaveLength(count)
  expect(broad.bounds.width).toBe(count * 30 + (count - 1) * 24)
  checkGeometry(broad, wide)
}, 10_000)

test("неровный лес сохраняет непересекающиеся карточки и каждую связь внутри bounds", () => {
  const input: HierarchyLayoutInput = {
    nodes: Array.from({length: 1_200}, (_, index) => ({
      id: String(index),
      ...index % 41 === 0 ? {} : {parentId: String(Math.floor((index - 1) / 3))},
      width: 30 + index * 37 % 151,
      height: 20 + index * 19 % 79,
    })),
    options: {siblingSpacing: 7, layerSpacing: 19},
  }
  const result = layoutHierarchy(input)
  checkGeometry(result, input)
  const byId = new Map(result.nodes.map(node => [node.id, node]))
  for (const edge of result.edges) {
    const points = [edge.sections[0].startPoint, ...edge.sections[0].bendPoints, edge.sections[0].endPoint]
    for (let index = 1; index < points.length; index++) {
      const start = points[index - 1]!
      const end = points[index]!
      for (const node of byId.values()) {
        if (start.x === end.x) {
          expect(start.x > node.x && start.x < node.x + node.width &&
            Math.max(start.y, end.y) > node.y && Math.min(start.y, end.y) < node.y + node.height).toBe(false)
        } else {
          expect(start.y > node.y && start.y < node.y + node.height &&
            Math.max(start.x, end.x) > node.x && Math.min(start.x, end.x) < node.x + node.width).toBe(false)
        }
      }
    }
  }
})

function expectError(
  input: HierarchyLayoutInput,
  code: HierarchyLayoutError["code"],
  nodeIds: readonly string[],
  field?: string,
): void {
  let caught: unknown
  try {
    layoutHierarchy(input)
  } catch (error) {
    caught = error
  }
  expect(caught).toBeInstanceOf(HierarchyLayoutError)
  const error = caught as HierarchyLayoutError
  expect(error.code).toBe(code)
  expect(error.witness.nodeIds).toEqual(nodeIds)
  expect(error.witness.field).toBe(field)
}

function checkGeometry(result: HierarchyLayoutOutput, input: HierarchyLayoutInput): void {
  expect(result.nodes.map(node => node.id)).toEqual(input.nodes.map(node => node.id))
  const byId = new Map(result.nodes.map(node => [node.id, node]))
  const layers = new Map<number, HierarchyLayoutOutput["nodes"][number][]>()
  for (const measured of input.nodes) {
    const node = byId.get(measured.id)!
    expect(node.width).toBe(measured.width)
    expect(node.height).toBe(measured.height)
    expect(node.x).toBeGreaterThanOrEqual(0)
    expect(node.y).toBeGreaterThanOrEqual(0)
    expect(node.x + node.width).toBeLessThanOrEqual(result.bounds.width)
    expect(node.y + node.height).toBeLessThanOrEqual(result.bounds.height)
    if (measured.parentId !== undefined) {
      const parent = byId.get(measured.parentId)!
      expect(node.y).toBeGreaterThanOrEqual(parent.y + parent.height + (input.options?.layerSpacing ?? 64))
    }
    const layer = layers.get(node.y) ?? []
    layer.push(node)
    layers.set(node.y, layer)
  }
  for (const layer of layers.values()) {
    layer.sort((a, b) => a.x - b.x)
    for (let index = 1; index < layer.length; index++) {
      const before = layer[index - 1]!
      expect(layer[index]!.x).toBeGreaterThanOrEqual(before.x + before.width)
    }
  }
  for (const edge of result.edges) {
    const parent = byId.get(edge.sourceNodeId)!
    const child = byId.get(edge.targetNodeId)!
    const section = edge.sections[0]
    expect(section.startPoint).toEqual({x: parent.x + parent.width / 2, y: parent.y + parent.height})
    expect(section.endPoint).toEqual({x: child.x + child.width / 2, y: child.y})
    const points = [section.startPoint, ...section.bendPoints, section.endPoint]
    for (const point of points) {
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true)
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(result.bounds.width)
      expect(point.y).toBeLessThanOrEqual(result.bounds.height)
    }
    for (let index = 1; index < points.length; index++) {
      expect(points[index]!.x === points[index - 1]!.x || points[index]!.y === points[index - 1]!.y).toBe(true)
    }
  }
}
