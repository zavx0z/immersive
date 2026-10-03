import {expect, test} from "bun:test"
import {treeScrollWindowStart} from "../widget/tree/src/windowing.ts"

test("не сдвигает материализацию внутри запаса и покрывает viewport при движении в обе стороны", () => {
  let start = 0
  let changes = 0
  for (const first of [...Array.from({length: 61}, (_, i) => i), ...Array.from({length: 61}, (_, i) => 60 - i)]) {
    const next = treeScrollWindowStart(first, 43, start, 80, 300, 12)
    if (next !== start) changes++
    start = next
    expect(start).toBeLessThanOrEqual(first)
    expect(start + 80).toBeGreaterThanOrEqual(first + 43)
  }
  expect(changes).toBeLessThan(10)
  expect(start).toBe(0)
})

test("учитывает большую высоту, прыжок, края и уменьшение списка", () => {
  expect(treeScrollWindowStart(20, 43, 0, 80, 300, 12)).toBe(0)
  const jump = treeScrollWindowStart(200, 43, 0, 80, 300, 12)
  expect(jump).toBeLessThanOrEqual(200)
  expect(jump + 80).toBeGreaterThanOrEqual(243)
  expect(treeScrollWindowStart(280, 43, jump, 80, 300, 12)).toBe(220)
  expect(treeScrollWindowStart(0, 43, 220, 80, 300, 12)).toBe(0)
  expect(treeScrollWindowStart(0, 43, 220, 80, 30, 12)).toBe(0)
  expect(treeScrollWindowStart(5, 78, 0, 80, 300, 12)).toBe(4)
})

test("после сдвига небольшое обратное движение не перестраивает окно повторно", () => {
  const next = treeScrollWindowStart(40, 43, 0, 80, 300, 12)
  expect(next).toBeGreaterThan(0)
  for (const first of [39, 40, 41, 40, 39]) {
    expect(treeScrollWindowStart(first, 43, next, 80, 300, 12)).toBe(next)
  }
})
