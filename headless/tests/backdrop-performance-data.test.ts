import {expect, test} from "bun:test"
import {frameMotion, orders, parseConfig, summarize} from "../fixtures/backdrop-performance-data.ts"

test("матрица производительности сохраняет оба размера Canvas, плотности и обратный порядок одинаковых фаз", () => {
  const config = parseConfig([])
  expect(config.resolutions).toEqual([{width: 1280, height: 720}, {width: 2730, height: 2176}])
  expect(config.densities).toEqual(["high", "low"])
  expect(config.motions).toEqual(["moving"])
  expect(orders(config.first)).toEqual([["none", "one", "three"], ["three", "one", "none"]])
  expect(orders("reverse")).toEqual([["three", "one", "none"], ["none", "one", "three"]])
  expect(config.samples).toBe(12)
  expect(config.warmup).toBe(4)
})

test("CLI сохраняет сведения об исходном коде baseline и уменьшенное число измерений", () => {
  const config = parseConfig(["--label", "baseline", "--base", "ac56cd57", "--samples", "3", "--warmup", "0", "--motion", "both", "--resolutions", "320x180", "--densities", "low", "--output", "result.json"])
  expect(config.label).toBe("baseline")
  expect(config.base).toBe("ac56cd57")
  expect(config.samples).toBe(3)
  expect(config.warmup).toBe(0)
  expect(config.motions).toEqual(["moving", "static"])
  expect(config.resolutions).toEqual([{width: 320, height: 180}])
  expect(config.densities).toEqual(["low"])
  expect(config.output).toBe("result.json")
})

test("all включает foreground, а both сохраняет прежние moving/static", () => {
  expect(parseConfig(["--motion", "all"]).motions).toEqual(["moving", "static", "foreground"])
  expect(parseConfig(["--motion", "both"]).motions).toEqual(["moving", "static"])
  expect(parseConfig(["--motion", "foreground"]).motions).toEqual(["foreground"])
})

test("foreground циклически двигает только последнего потомка, сохраняя World и повторяемость фаз", () => {
  const firstCycle = Array.from({length: 11}, (_, frame) => frameMotion("foreground", frame))
  expect(new Set(firstCycle.map(pose => pose.childLeftCssPx)).size).toBe(11)
  expect(firstCycle.every(pose => pose.worldOffsetCssPx === 0)).toBe(true)
  firstCycle.forEach((pose, frame) => expect(frameMotion("foreground", frame + 11)).toEqual(pose))
  expect(frameMotion("foreground", 0)).toEqual({worldOffsetCssPx: 0, childLeftCssPx: 24})
  for (const frame of [0, 1, 7, 30]) {
    expect(frameMotion("static", frame)).toEqual({worldOffsetCssPx: 0, childLeftCssPx: 24})
    expect(frameMotion("moving", frame)).toEqual({worldOffsetCssPx: Math.sin(frame / 10) * 10, childLeftCssPx: 24})
  }
})

for (const args of [["--samples", "0"], ["--warmup", "-1"], ["--sigma", "NaN"], ["--resolutions", "0x720"], ["--first", "random"], ["--motion", "unknown"], ["--densities", "high,high"], ["--samples"], ["--unknown", "1"], ["--samples", "2", "--samples", "3"]]) {
  test(`неверная конфигурация benchmark отклоняется до нативной работы: ${args.join(" ")}`, () => {
    expect(() => parseConfig(args)).toThrow()
  })
}

test("статистика сохраняет порядок измерений и вычисляет медиану и p95 по ближайшему рангу", () => {
  const raw = [4, 1, 3, 2]
  expect(summarize(raw)).toEqual({count: 4, medianMs: 2.5, p95Ms: 4})
  expect(raw).toEqual([4, 1, 3, 2])
  expect(summarize([5, 1, 3])).toEqual({count: 3, medianMs: 3, p95Ms: 5})
  expect(summarize(Array.from({length: 20}, (_, index) => index + 1))).toEqual({count: 20, medianMs: 10.5, p95Ms: 19})
  for (const invalid of [[], [-1], [Number.NaN], [Number.POSITIVE_INFINITY]]) {
    expect(() => summarize(invalid)).toThrow()
  }
})
