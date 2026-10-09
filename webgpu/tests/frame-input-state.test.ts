import {expect, test} from "bun:test"
import {FrameInputState, type FrameInputs} from "../src/renderer/frame-input-state.ts"

const input = (references: readonly unknown[] = [], data: readonly ArrayBufferView[] = []): FrameInputs => ({references, data})

test("replay requires an explicit successful commit and invalidate revokes it", () => {
  const state = new FrameInputState()
  expect(state.matches(input())).toBe(false)
  state.commit(input())
  expect(state.matches(input())).toBe(true)
  state.invalidate()
  expect(state.matches(input())).toBe(false)
  state.commit(input())
  expect(state.matches(input())).toBe(true)
})

test("references compare by Object.is with exact order, primitive types, NaN and signed zero", () => {
  const state = new FrameInputState(), object = {}, symbol = Symbol("frame")
  const references = [object, symbol, Number.NaN, -0, "1", 1, undefined, null, true]
  state.commit(input(references))
  expect(state.matches(input([...references]))).toBe(true)
  for (const [index, replacement] of [[0, {}], [1, Symbol("frame")], [3, 0], [4, 1], [5, "1"], [6, null], [8, false]] as const) {
    const changed = [...references]
    changed[index] = replacement
    expect(state.matches(input(changed))).toBe(false)
  }
  expect(state.matches(input(references.slice(1)))).toBe(false)
  expect(state.matches(input([...references, object]))).toBe(false)
  expect(state.matches(input([symbol, object, ...references.slice(2)]))).toBe(false)
  references[0] = {}
  expect(state.matches(input(references))).toBe(false)
  expect(state.matches(input([object, symbol, Number.NaN, -0, "1", 1, undefined, null, true]))).toBe(true)
})

test("commit owns uniform bytes and detects in-place writes without publishing a failed candidate", () => {
  const state = new FrameInputState(), reference = {}
  const uniforms = new Float32Array([1, 2, 3, 4])
  state.commit(input([reference], [uniforms]))
  uniforms[1] = 9
  expect(state.matches(input([reference], [uniforms]))).toBe(false)
  // Неудачный render кандидата не вызывает commit и не заменяет прежний кадр.
  expect(state.matches(input([reference], [new Float32Array([1, 2, 3, 4])]))).toBe(true)
  uniforms[1] = 2
  expect(state.matches(input([reference], [uniforms]))).toBe(true)
  state.commit(input([reference], [new Float32Array([5, 6, 7, 8])]))
  expect(state.matches(input([reference], [uniforms]))).toBe(false)
  expect(state.matches(input([reference], [new Float32Array([5, 6, 7, 8])]))).toBe(true)
})

test("raw byte comparison distinguishes NaN payloads and negative zero without numeric canonicalization", () => {
  const state = new FrameInputState()
  const bits = new Uint32Array([0x7fc00001, 0x80000000])
  const floats = new Float32Array(bits.buffer)
  expect(Number.isNaN(floats[0])).toBe(true)
  expect(Object.is(floats[1], -0)).toBe(true)
  state.commit(input([], [floats]))
  expect(state.matches(input([], [new Uint32Array([0x7fc00001, 0x80000000])]))).toBe(true)
  expect(state.matches(input([], [new Uint32Array([0x7fc00002, 0x80000000])]))).toBe(false)
  expect(state.matches(input([], [new Uint32Array([0x7fc00001, 0x00000000])]))).toBe(false)
})

test("nonzero offsets and DataView compare only their visible byte ranges", () => {
  const state = new FrameInputState()
  const backing = new Uint8Array([99, 1, 2, 3, 4, 88])
  state.commit(input([], [new DataView(backing.buffer, 1, 4)]))
  backing[0] = 77
  backing[5] = 66
  expect(state.matches(input([], [backing.subarray(1, 5)]))).toBe(true)
  const other = new Uint8Array([0, 0, 1, 2, 3, 4, 0])
  expect(state.matches(input([], [new DataView(other.buffer, 2, 4)]))).toBe(true)
  other[3] = 9
  expect(state.matches(input([], [new DataView(other.buffer, 2, 4)]))).toBe(false)
  expect(state.matches(input([], [backing]))).toBe(false)
})

test("buffer order, count and lengths remain significant across growth, shrink and reuse", () => {
  const state = new FrameInputState()
  const first = new Uint8Array([1, 2]), second = new Uint8Array([3, 4])
  state.commit(input([], [first, second]))
  expect(state.matches(input([], [second, first]))).toBe(false)
  expect(state.matches(input([], [new Uint8Array([1, 2, 3, 4])]))).toBe(false)
  expect(state.matches(input([], [first]))).toBe(false)
  const grown = new Uint8Array(1025).fill(5)
  state.commit(input([], [grown, new Uint8Array()]))
  expect(state.matches(input([], [new Uint8Array(1025).fill(5), new DataView(new ArrayBuffer(0))]))).toBe(true)
  state.commit(input([], [first]))
  expect(state.matches(input([], [first]))).toBe(true)
  expect(state.matches(input([], [first, new Uint8Array()]))).toBe(false)
  expect(state.matches(input([], [new Uint8Array([1, 2, 5])]))).toBe(false)
  state.invalidate()
  state.commit(input([], [grown]))
  expect(state.matches(input([], [new Uint8Array(1025).fill(5)]))).toBe(true)
})

test("a malformed later view rejects commit before overwriting the previous owned bytes", () => {
  const state = new FrameInputState()
  state.commit(input(["valid"], [new Uint8Array([1, 2])]))
  const detached = new ArrayBuffer(2)
  structuredClone(detached, {transfer: [detached]})
  expect(() => state.commit(input(["failed"], [new Uint8Array([9, 9]), {buffer: detached, byteOffset: 0, byteLength: 2} as ArrayBufferView]))).toThrow()
  expect(state.matches(input(["valid"], [new Uint8Array([1, 2])]))).toBe(true)
})
