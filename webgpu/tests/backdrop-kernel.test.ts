import {expect, test} from "bun:test"
import {createBackdropKernel, type BackdropKernel, type BackdropKernelMode} from "../src/renderer/backdrop-kernel.ts"

type Pixel = readonly [number, number, number, number]

const reference = (sigma: number, sourcePixels: number, physicalPixels: number): BackdropKernel => ({
  offsets: Array.from({length: 19}, (_, index) => (index - 9) * sigma / 3 * sourcePixels / physicalPixels),
  weights: Array.from({length: 19}, (_, index) => Math.exp(-.5 * ((index - 9) / 3) ** 2)),
  count: 19,
})

/** Независимый CPU sampler: texel-center linear/nearest, clamp и depth validity. */
const evaluate = (
  pixels: readonly Pixel[],
  position: number,
  kernel: BackdropKernel,
  mode: BackdropKernelMode,
  valid: readonly boolean[],
): Pixel => {
  const clamp = (index: number) => Math.max(0, Math.min(pixels.length - 1, index))
  const color = [0, 0, 0, 0]
  let total = 0
  for (let tap = 0; tap < kernel.count; tap++) {
    const coordinate = position + kernel.offsets[tap]!
    const weight = kernel.weights[tap]!
    if (mode === "nearestDepth") {
      const index = clamp(Math.floor(coordinate + .5))
      if (!valid[index]) continue
      for (let channel = 0; channel < 4; channel++) color[channel]! += pixels[index]![channel]! * weight
    } else {
      const lower = Math.floor(coordinate), fraction = coordinate - lower
      for (let channel = 0; channel < 4; channel++) {
        const sample = pixels[clamp(lower)]![channel]! * (1 - fraction) + pixels[clamp(lower + 1)]![channel]! * fraction
        color[channel]! += sample * weight
      }
    }
    total += weight
  }
  return color.map(value => value / Math.max(total, .000001)) as unknown as Pixel
}

const texture = (size: number): readonly Pixel[] => Array.from({length: size}, (_, index) => {
  const alpha = ((index * 17 + 3) % 29) / 28
  return [((index * 13) % 17) / 16 * alpha, ((index * 7 + 2) % 11) / 10 * alpha,
    ((index * 5 + 1) % 13) / 12 * alpha, alpha]
})

test.each(["linear", "nearestDepth"] as const)("%s preserves arbitrary premultiplied RGBA at every pixel including clamped edges", mode => {
  for (const sigma of [.5, 1, 2, 4, 8, 16, 24]) {
    for (const physicalPixels of [1, 7, 53, 101, 2177]) {
      const scale = sigma >= 8 ? 8 : sigma >= 4 ? 4 : sigma >= 2 ? 2 : 1
      const sourcePixels = Math.max(1, Math.ceil(physicalPixels / scale))
      const pixels = texture(sourcePixels)
      const compact = createBackdropKernel(sigma, sourcePixels, physicalPixels, mode)
      const original = reference(sigma, sourcePixels, physicalPixels)
      expect(compact.count).toBeLessThanOrEqual(19)
      expect(compact.count).toBeGreaterThan(0)
      expect(compact.offsets).toHaveLength(compact.count)
      expect(compact.weights).toHaveLength(compact.count)
      expect(compact.weights.reduce((sum, value) => sum + value, 0)).toBeCloseTo(original.weights.reduce((sum, value) => sum + value, 0), 12)
      const masks = [pixels.map(() => true), pixels.map((_, index) => index % 3 !== 0), pixels.map(() => false)]
      for (const valid of mode === "linear" ? masks.slice(0, 1) : masks) {
        for (let position = 0; position < pixels.length; position++) {
          const expected = evaluate(pixels, position, original, mode, valid)
          const actual = evaluate(pixels, position, compact, mode, valid)
          actual.forEach((value, channel) => expect(value).toBeCloseTo(expected[channel]!, 10))
          for (let channel = 0; channel < 3; channel++) expect(actual[channel]!).toBeLessThanOrEqual(actual[3]! + 1e-12)
        }
      }
    }
  }
})

test("constant color and Gaussian weight survive zero sigma, sparse taps and saturated boundaries", () => {
  const pixel: Pixel = [.1, .2, .3, .4]
  for (const mode of ["linear", "nearestDepth"] as const) {
    for (const sigma of [0, .5, 8, 24, 1000]) {
      const kernel = createBackdropKernel(sigma, 7, 53, mode)
      const pixels = Array.from({length: 7}, () => pixel)
      for (const position of [0, 3, 6]) {
        evaluate(pixels, position, kernel, mode, pixels.map(() => true))
          .forEach((value, channel) => expect(value).toBeCloseTo(pixel[channel]!, 12))
      }
      if (sigma === 0) expect(kernel.count).toBe(1)
      expect(kernel.weights.every(weight => Number.isFinite(weight) && weight > 0)).toBe(true)
      expect(kernel.offsets.every(Number.isFinite)).toBe(true)
    }
  }
})

test("nearest-depth keeps all original taps at and near a half-texel tie", () => {
  for (const sigma of [.5, .5 - 1e-8, .5 + 1e-8]) {
    const compact = createBackdropKernel(sigma, 64, 64, "nearestDepth")
    const original = reference(sigma, 64, 64)
    expect(compact.count).toBe(19)
    compact.offsets.forEach((offset, index) => expect(offset).toBeCloseTo(original.offsets[index]!, 12))
    expect(compact.weights).toEqual(original.weights)
  }
})

test("distinct depth-tested texels remain distinct even with alternating validity and color", () => {
  const pixels: Pixel[] = [[.8, 0, 0, .8], [0, .5, 0, .5], [0, 0, .2, .2], [.1, .1, .1, .3], [.5, 0, 0, .5]]
  const mask = [false, true, false, true, false]
  const compact = createBackdropKernel(8, 270, 2160, "nearestDepth")
  expect(compact.count).toBe(7)
  expect(compact.offsets.every(Number.isInteger)).toBe(true)
  for (let position = 0; position < pixels.length; position++) {
    const expected = evaluate(pixels, position, reference(8, 270, 2160), "nearestDepth", mask)
    const actual = evaluate(pixels, position, compact, "nearestDepth", mask)
    actual.forEach((value, channel) => expect(value).toBeCloseTo(expected[channel]!, 12))
  }
})

test("sigma8 at scale8 needs four bilinear taps or seven separate depth checks; odd grids stay exact", () => {
  expect(createBackdropKernel(8, 272, 2176, "linear").count).toBe(4)
  expect(createBackdropKernel(8, 272, 2176, "nearestDepth").count).toBe(7)
  expect(createBackdropKernel(8, 273, 2177, "linear").count).toBe(5)
  expect(createBackdropKernel(8, 273, 2177, "nearestDepth").count).toBe(7)
})

test("unhelpful compaction falls back to the original nineteen taps and output is immutable/deterministic", () => {
  for (const mode of ["linear", "nearestDepth"] as const) {
    const first = createBackdropKernel(100, 64, 64, mode)
    expect(first.count).toBe(19)
    expect(first).toEqual(createBackdropKernel(100, 64, 64, mode))
    expect(first.weights).toEqual(reference(100, 64, 64).weights)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.offsets)).toBe(true)
    expect(Object.isFrozen(first.weights)).toBe(true)
  }
})

test("invalid kernel inputs cannot emit non-finite GPU parameters", () => {
  for (const sigma of [-1, Number.NaN, Infinity, Number.MAX_VALUE]) {
    expect(() => createBackdropKernel(sigma, 64, 64, "linear")).toThrow(RangeError)
  }
  for (const size of [0, -1, .5, Infinity, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => createBackdropKernel(8, size, 64, "linear")).toThrow("sourcePixels")
    expect(() => createBackdropKernel(8, 64, size, "linear")).toThrow("physicalPixels")
  }
  expect(() => createBackdropKernel(8, 64, 64, "unknown" as BackdropKernelMode)).toThrow(TypeError)
})
