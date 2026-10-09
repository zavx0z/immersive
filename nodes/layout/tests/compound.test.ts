import {expect, test} from "bun:test"
import {
  CompoundLayoutError,
  layoutCompound,
  type CompoundLayoutInput,
} from "@zavx0z/immersive-nodes-layout/compound"

test("пустой набор и одиночная измеренная карточка имеют точные bounds", () => {
  expect(layoutCompound({nodes: [], options: {outerPadding: 20}})).toEqual({
    direction: "DOWN",
    bounds: {x: 0, y: 0, width: 0, height: 0},
    nodes: [],
  })
  expect(layoutCompound({nodes: [{id: "card", width: 100.5, height: 70.25}], options: {outerPadding: 5}})).toEqual({
    direction: "DOWN",
    bounds: {x: 0, y: 0, width: 110.5, height: 80.25},
    nodes: [{id: "card", x: 5, y: 5, width: 100.5, height: 70.25}],
  })
})

test("вложенные Frames содержат отдельные карточки родителей и резервируют заголовки", () => {
  const input: CompoundLayoutInput = {
    nodes: [
      {id: "leaf", parentId: "frame:child", width: 60, height: 80},
      {id: "root-card", parentId: "frame:root", width: 120, height: 90},
      {id: "child-card", parentId: "frame:child", width: 100, height: 70},
      {id: "frame:child", parentId: "frame:root", width: 1, height: 30, contentHeight: 30},
      {id: "frame:root", width: 1, height: 40, contentHeight: 40},
    ],
    options: {padding: 10, spacing: 7, outerPadding: 9},
  }
  const output = layoutCompound(input)
  const geometry = new Map(output.nodes.map(node => [node.id, node]))
  expect(output.nodes.map(node => node.id)).toEqual(input.nodes.map(node => node.id))
  expect(geometry.get("frame:child")!.width).toBeGreaterThan(100)
  expect(geometry.get("frame:root")!.height).toBeGreaterThan(90)
  checkGeometry(input)
})

test("размер Frames не уменьшается, contentHeight по умолчанию равен исходной высоте", () => {
  const output = layoutCompound({
    nodes: [
      {id: "frame", width: 1_000, height: 100, contentHeight: 25},
      {id: "inner", parentId: "frame", width: 400, height: 300},
      {id: "leaf", parentId: "inner", width: 40, height: 50},
    ],
    options: {padding: 0},
  })
  expect(output.nodes[0]!.width).toBe(1_000)
  expect(output.nodes[1]!.height).toBe(350)
  expect(output.nodes[2]!.y).toBe(325)
})

test("замороженные данные не меняются, перестановка узлов не меняет геометрию по ID", () => {
  const nodes = Object.freeze(Array.from({length: 300}, (_, index) => Object.freeze({
    id: `card:${index}`,
    ...index % 13 === 0 ? {} : {parentId: `card:${Math.floor((index - 1) / 3)}`},
    width: 50 + index * 13 % 120,
    height: 30 + index * 17 % 80,
  })))
  const options = Object.freeze({padding: 7.5, spacing: 3.25, aspectRatio: 1.3})
  const input = Object.freeze({nodes, options})
  const first = layoutCompound(input)
  const reversed = layoutCompound({nodes: [...nodes].reverse(), options})
  expect(new Map(reversed.nodes.map(node => [node.id, node]))).toEqual(new Map(first.nodes.map(node => [node.id, node])))
  expect(reversed.bounds).toEqual(first.bounds)
  expect(layoutCompound(input)).toEqual(first)
  checkGeometry(input)
})

test("тысячи одинаковых карточек занимают сбалансированные строки вместо горизонтальной полосы", () => {
  const count = 4_096
  const input: CompoundLayoutInput = {
    nodes: [
      {id: "repo", width: 1, height: 40, contentHeight: 40},
      ...Array.from({length: count}, (_, index) => ({id: `card:${index}`, parentId: "repo", width: 960, height: 680})),
    ],
    options: {aspectRatio: 1.5, spacing: 24, padding: 24},
  }
  const result = layoutCompound(input)
  expect(result.nodes).toHaveLength(count + 1)
  expect(result.bounds.width / result.bounds.height).toBeGreaterThan(1.3)
  expect(result.bounds.width / result.bounds.height).toBeLessThan(1.7)
  expect(result.bounds.width).toBeLessThan(960 * count / 20)
  const occupied = count * 960 * 680
  expect(occupied / (result.bounds.width * result.bounds.height)).toBeGreaterThan(0.9)
  checkGeometry(input, false)
})

test("20000 уровней Frames рассчитываются без рекурсивного стека", () => {
  const count = 20_000
  const input: CompoundLayoutInput = {
    nodes: Array.from({length: count}, (_, index) => ({
      id: String(index),
      ...index === 0 ? {} : {parentId: String(index - 1)},
      width: 10,
      height: 10,
      contentHeight: 2,
    })),
    options: {padding: 1, spacing: 1},
  }
  const result = layoutCompound(input)
  expect(result.nodes).toHaveLength(count)
  expect(result.bounds.width).toBe(10 + (count - 1) * 2)
  expect(result.bounds.height).toBe(10 + (count - 1) * 4)
  expect(result.nodes.at(-1)!.x).toBe(count - 1)
  expect(result.nodes.at(-1)!.y).toBe((count - 1) * 3)
})

test("разные размеры, несколько корней и нулевые зазоры не дают пересечений", () => {
  checkGeometry({
    nodes: Array.from({length: 180}, (_, index) => ({
      id: String(index),
      ...index % 23 === 0 ? {} : {parentId: String(Math.floor((index - 1) / 5))},
      width: 20 + index * 17 % 200,
      height: 10 + index * 13 % 160,
    })),
    options: {spacing: 0, padding: 0, aspectRatio: 2},
  })
})

test("дубликаты, отсутствующий родитель, хвост перед циклом и самоссылка дают свидетельства", () => {
  const node = (id: string, parentId?: string) => ({id, width: 10, height: 10, ...parentId === undefined ? {} : {parentId}})
  expectError({nodes: [node("a"), node("a")]}, "DUPLICATE_NODE", ["a"])
  expectError({nodes: [node("a", "missing")]}, "UNKNOWN_PARENT", ["a", "missing"])
  expectError({nodes: [node("a", "a")]}, "CYCLE_DETECTED", ["a", "a"])
  expectError({nodes: [node("tail", "a"), node("a", "b"), node("b", "c"), node("c", "a")]}, "CYCLE_DETECTED", ["a", "b", "c", "a"])
})

test("невалидные числа, contentHeight и переполнение отклоняются до выдачи результата", () => {
  for (const value of [NaN, Infinity, -Infinity, -1, 0]) {
    for (const field of ["width", "height"] as const) {
      expectError({nodes: [{id: "a", width: 20, height: 30, [field]: value}]}, "INVALID_GEOMETRY", ["a"], field)
    }
    expectError({nodes: [], options: {aspectRatio: value}}, "INVALID_GEOMETRY", [], "aspectRatio")
  }
  for (const value of [NaN, Infinity, -1]) {
    for (const field of ["spacing", "padding", "outerPadding"] as const) {
      expectError({nodes: [], options: {[field]: value}}, "INVALID_GEOMETRY", [], field)
    }
    expectError({nodes: [{id: "a", width: 20, height: 30, contentHeight: value}]}, "INVALID_GEOMETRY", ["a"], "contentHeight")
  }
  expectError({nodes: [{id: "a", width: 20, height: 30, contentHeight: 31}]}, "INVALID_GEOMETRY", ["a"], "contentHeight")
  expectError({nodes: [{id: "a", width: 20, height: 30}], options: {outerPadding: Number.MAX_VALUE}}, "INVALID_GEOMETRY", [], "width")
  expect(() => layoutCompound({nodes: [
    {id: "a", width: Number.MAX_VALUE, height: 20},
    {id: "b", width: Number.MAX_VALUE, height: 20},
  ]})).toThrow(CompoundLayoutError)
})

function expectError(input: CompoundLayoutInput, code: CompoundLayoutError["code"], nodeIds: string[], field?: string): void {
  let caught: unknown
  try { layoutCompound(input) } catch (error) { caught = error }
  expect(caught).toBeInstanceOf(CompoundLayoutError)
  expect((caught as CompoundLayoutError).code).toBe(code)
  expect((caught as CompoundLayoutError).witness).toEqual({nodeIds, ...field === undefined ? {} : {field}})
}

function checkGeometry(input: CompoundLayoutInput, checkPairs = true): void {
  const result = layoutCompound(input)
  const byId = new Map(result.nodes.map(node => [node.id, node]))
  const children = new Map<string | undefined, typeof result.nodes[number][]>()
  const parents = new Set(input.nodes.flatMap(node => node.parentId === undefined ? [] : [node.parentId]))
  const spacing = input.options?.spacing ?? 24
  const padding = input.options?.padding ?? 24
  for (const measured of input.nodes) {
    const rect = byId.get(measured.id)!
    if (!parents.has(rect.id)) {
      expect(rect.width).toBe(measured.width)
      expect(rect.height).toBe(measured.height)
    }
    const owner = measured.parentId === undefined ? result.bounds : byId.get(measured.parentId)!
    const inset = measured.parentId === undefined ? input.options?.outerPadding ?? 0 : padding
    const contentHeight = measured.parentId === undefined ? 0 : input.nodes.find(node => node.id === measured.parentId)!.contentHeight ?? input.nodes.find(node => node.id === measured.parentId)!.height
    expect(rect.x).toBeGreaterThanOrEqual(owner.x + inset)
    expect(rect.y).toBeGreaterThanOrEqual(owner.y + contentHeight + inset)
    expect(rect.x + rect.width).toBeLessThanOrEqual(owner.x + owner.width - inset)
    expect(rect.y + rect.height).toBeLessThanOrEqual(owner.y + owner.height - inset)
    const siblings = children.get(measured.parentId) ?? []
    siblings.push(rect)
    children.set(measured.parentId, siblings)
  }
  if (!checkPairs) return
  for (const siblings of children.values()) {
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const a = siblings[i]!
        const b = siblings[j]!
        const horizontalGap = Math.max(b.x - a.x - a.width, a.x - b.x - b.width)
        const verticalGap = Math.max(b.y - a.y - a.height, a.y - b.y - b.height)
        expect(horizontalGap >= spacing || verticalGap >= spacing).toBe(true)
      }
    }
  }
}
