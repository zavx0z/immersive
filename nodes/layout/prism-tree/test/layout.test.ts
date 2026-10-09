import {expect, test} from "bun:test"
import layoutPrismTree, {type ImmersiveNodesLayoutPrismTree as Contract} from "@zavx0z/immersive-nodes-layout-prism-tree"
import {verify} from "./verify.ts"
import type {ErrorCode} from "../src/error.ts"

test("пустое дерево и один Display имеют точную геометрию и вытянутый лист", () => {
  expect(layoutPrismTree({nodes: []})).toEqual({nodes: [], layers: [], stems: [], branches: [], floorZ: 0, groundDepth: null, bounds: {x: 0, y: 0, z: 0, width: 0, height: 0, depth: 0}})
  const result = layoutPrismTree({nodes: [{id: "root", width: 180, height: 100}], options: {layerGap: 200}})
  expect(result.nodes).toEqual([{id: "root", depth: 0, rect: {x: -90, y: -50, z: 100, width: 180, height: 100}}])
  expect(result.stems).toHaveLength(1)
  expect(result.stems[0]!.bottom).toEqual({x: -90, y: -50, z: 0, width: 180, height: 100})
  expect(result.branches).toEqual([])
  expect(result.groundDepth).toBe(0)
  expect(result.bounds).toEqual({x: -90, y: -50, z: 0, width: 180, height: 100, depth: 100})
})

test("родитель встречается один раз, тело сохраняет целое сечение, развилка повторяется на каждом depth", () => {
  const input: Contract.Input = {
    nodes: [
      {id: "c", parentId: "a", width: 100, height: 50},
      {id: "b", parentId: "root", width: 80, height: 140},
      {id: "root", width: 180, height: 100},
      {id: "a", parentId: "root", width: 120, height: 70},
    ],
  }
  const result = verify(input)
  expect(result.nodes.map(node => node.id)).toEqual(input.nodes.map(node => node.id))
  expect(result.nodes).toHaveLength(4)
  expect(result.stems).toHaveLength(4)
  expect(result.branches).toHaveLength(3)
  expect(result.groundDepth).toBe(1)
  expect(result.stems.find(stem => stem.nodeId === "b")!.bottom.z).toBe(0)
  expect(result.stems.find(stem => stem.nodeId === "c")!.bottom.z).toBe(-240)
  expect(result.nodes.find(node => node.id === "c")!.rect.z).toBe(-120)
})

test("desktop/mobile размеры и aspect точны при разных весах, разной глубине и сжатии слоёв", () => {
  const nodes = Array.from({length: 420}, (_, n) => ({
    id: String(n),
    ...n % 31 === 0 ? {} : {parentId: String(Math.floor((n - 1) / 4))},
    width: n % 3 === 0 ? 390 : 960 + n % 7 * 20,
    height: n % 3 === 0 ? 844 : 540 + n % 11 * 10,
    weight: 1 + n % 17 / 3,
  }))
  verify({nodes, options: {spacing: 12, layerGap: 150, aspectRatio: 1.4}})
})

test("все объёмы ветвей не пересекаются при перемещении и изменении размеров их семейств", () => {
  for (let seed = 1; seed <= 5; seed++) {
    const nodes = Array.from({length: 200}, (_, n) => ({
      id: `node:${n}`,
      ...n === 0 ? {} : {parentId: `node:${Math.floor((n - 1) / (2 + seed % 4))}`},
      width: 10 + n * 37 % (100 + seed * 7),
      height: 10 + n * 53 % (130 + seed * 11),
      weight: 1 + n * 13 % 23,
    }))
    verify({nodes, options: {spacing: seed - 1, aspectRatio: .7 + seed / 4}})
  }
})

test("вес влияет на разделения, но не заменяет размер Display площадью поддерева", () => {
  const nodes: Contract.Input["nodes"] = [
    {id: "root", width: 180, height: 100},
    ...Array.from({length: 4}, (_, n) => ({id: String(n), parentId: "root", width: 100, height: 100})),
  ]
  const first = verify({nodes})
  const weighted = verify({nodes: nodes.map(node => ({...node, weight: node.id === "3" ? 100 : 1}))})
  expect(weighted.nodes.map(node => node.rect)).not.toEqual(first.nodes.map(node => node.rect))
  expect(weighted.nodes.find(node => node.id === "root")!.rect.width).toBe(180)
})

test("input frozen, порядок результата исходный, перестановка входа не меняет геометрию по ID", () => {
  const nodes = Object.freeze([
    {id: "r", width: 3.5, height: 2.25},
    {id: "a", parentId: "r", width: 1.75, height: 3.25},
    {id: "b", parentId: "r", width: 2.5, height: 1.5},
    {id: "c", parentId: "a", width: 1.75, height: 2.25},
  ].map(node => Object.freeze(node)))
  const input = Object.freeze({nodes, options: Object.freeze({spacing: .125, layerGap: .1})})
  const first = verify(input)
  const reversed = layoutPrismTree({...input, nodes: [...nodes].reverse()})
  expect(new Map(reversed.nodes.map(node => [node.id, node]))).toEqual(new Map(first.nodes.map(node => [node.id, node])))
  expect(reversed.layers).toEqual(first.layers)
  expect(new Map(reversed.branches.map(branch => [branch.id, branch]))).toEqual(new Map(first.branches.map(branch => [branch.id, branch])))
  expect(first.stems.find(stem => stem.nodeId === "b")!.bottom.z).toBe(0)
})

test("20000 уровней не ограничены стеком, новые карточки не размножаются", () => {
  const count = 20_000
  const result = layoutPrismTree({nodes: Array.from({length: count}, (_, n) => ({id: String(n), ...n === 0 ? {} : {parentId: String(n - 1)}, width: 390, height: 844}))})
  expect(result.nodes).toHaveLength(count)
  expect(result.stems).toHaveLength(count)
  expect(result.branches).toHaveLength(count - 1)
  expect(result.layers).toHaveLength(count)
  expect(result.groundDepth).toBe(count - 1)
  expect(result.stems.at(-1)!.bottom.z).toBe(0)
  expect(result.bounds.width).toBe(390)
  expect(result.bounds.height).toBe(844)
})

test("20000 детей упакованы в обеих осях и сохраняют точную площадь карточек", () => {
  const count = 20_000
  const result = layoutPrismTree({nodes: [
    {id: "root", width: 960, height: 540},
    ...Array.from({length: count}, (_, n) => ({id: String(n), parentId: "root", width: 960, height: 540})),
  ]})
  const layer = result.layers[1]!
  expect(result.stems).toHaveLength(count + 1)
  expect(result.branches).toHaveLength(count)
  expect(layer.bounds.width / layer.bounds.height).toBeGreaterThan(.8)
  expect(layer.bounds.width / layer.bounds.height).toBeLessThan(3)
  expect(layer.bounds.width).toBeLessThan(count * 960 / 20)
  expect(count * 960 * 540 / (layer.bounds.width * layer.bounds.height)).toBeGreaterThan(.6)
})

test("comb с 12000 узлами не делает проход по всем предкам для каждого слоя", () => {
  const nodes: Contract.Input["nodes"][number][] = []
  for (let n = 0; n < 6_000; n++) {
    nodes.push({id: `spine:${n}`, ...n === 0 ? {} : {parentId: `spine:${n - 1}`}, width: 100, height: 60})
    nodes.push({id: `leaf:${n}`, parentId: `spine:${n}`, width: 40, height: 80})
  }
  const result = layoutPrismTree({nodes})
  expect(result.nodes).toHaveLength(12_000)
  expect(result.layers).toHaveLength(6_001)
  expect(result.groundDepth).toBe(1)
  expect(result.stems.find(stem => stem.nodeId === "leaf:0")!.bottom.z).toBe(0)
  expect(result.stems.find(stem => stem.nodeId === "leaf:5999")!.bottom.z).toBeLessThan(0)
})

test("дубликаты, неизвестные родители и циклы имеют точное свидетельство", () => {
  const node = (id: string, parentId?: string) => ({id, width: 10, height: 10, ...parentId === undefined ? {} : {parentId}})
  expectError({nodes: [node("a"), node("a")]}, "DUPLICATE_NODE", ["a"])
  expectError({nodes: [node("a", "missing")]}, "UNKNOWN_PARENT", ["a", "missing"])
  expectError({nodes: [node("a", "a")]}, "CYCLE_DETECTED", ["a", "a"])
  expectError({nodes: [node("tail", "a"), node("a", "b"), node("b", "a")]}, "CYCLE_DETECTED", ["a", "b", "a"])
})

test("повторяющиеся два ребёнка на 11 уровнях не создают одномерную полосу", () => {
  const result = layoutPrismTree({nodes: Array.from({length: 4_095}, (_, n) => ({
    id: String(n),
    ...n === 0 ? {} : {parentId: String(Math.floor((n - 1) / 2))},
    width: 960,
    height: 540,
  }))})
  const layer = result.layers.at(-1)!
  expect(layer.nodeIds).toHaveLength(2_048)
  expect(layer.bounds.width / layer.bounds.height).toBeGreaterThan(.8)
  expect(layer.bounds.width / layer.bounds.height).toBeLessThan(3)
  expect(2_048 * 960 * 540 / (layer.bounds.width * layer.bounds.height)).toBeGreaterThan(.8)
})

test("неконечные числа, отрицательные размеры и переполнение не попадают в geometry", () => {
  for (const value of [NaN, Infinity, -Infinity, -1, 0]) {
    for (const field of ["width", "height", "weight"] as const) expectError({nodes: [{id: "a", width: 10, height: 10, [field]: value}]}, "INVALID_GEOMETRY", ["a"], field)
    for (const field of ["layerGap", "bodyDepth", "aspectRatio"] as const) expectError({nodes: [], options: {[field]: value}}, "INVALID_GEOMETRY", [], field)
  }
  for (const value of [NaN, Infinity, -1]) expectError({nodes: [], options: {spacing: value}}, "INVALID_GEOMETRY", [], "spacing")
  expectError({nodes: [{id: "a", width: 10, height: 10}, {id: "b", parentId: "a", width: 10, height: 10}], options: {layerGap: Number.MAX_VALUE}}, "INVALID_GEOMETRY", [], "topZ")
  expect(() => layoutPrismTree({nodes: [{id: "a", width: Number.MAX_VALUE, height: Number.MAX_VALUE}, {id: "b", width: Number.MAX_VALUE, height: Number.MAX_VALUE}]})).toThrow()
  expectError({nodes: [{id: "a", width: Number.MAX_VALUE, height: 10}, {id: "b", width: 10, height: Number.MAX_VALUE}]}, "INVALID_GEOMETRY", ["b"], "packingArea")
})

function expectError(input: Contract.Input, code: ErrorCode, nodeIds: string[], field?: string): void {
  let caught: unknown
  try { layoutPrismTree(input) } catch (error) { caught = error }
  expect(caught).toBeInstanceOf(Error)
  expect((caught as {code: string}).code).toBe(code)
  expect((caught as {witness: unknown}).witness).toEqual({nodeIds, ...field === undefined ? {} : {field}})
}
