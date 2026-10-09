import {expect, test} from "bun:test"
import {compositeGlass, glassShell, linearToSrgb, srgbToLinear, type GlassAccumulation} from "../src/renderer/glass-optics"
import {glassShader, glassCompositeShader} from "../src/renderer/shader/glass"

test("цветное стекло без света не светится на чёрном", () => {
  const shells = [[.2, .8, .9], [.9, .3, .1]].map(color => glassShell(color as [number, number, number], .5, 1, 1.5, .8))
  expect(compositeGlass([0, 0, 0, 1], shells)).toEqual([0, 0, 0, 1])
  expect(compositeGlass([0, 0, 0, 0], shells).slice(0, 3)).toEqual([0, 0, 0])
})

test("одинаковые показатели преломления не создают границу даже под скользящим углом", () => {
  for (const facing of [0, .001, .25, .5, 1]) {
    const shell = glassShell([1, 1, 1], 1, 0, 1, facing)
    expect(shell.depth).toEqual([0, 0, 0, 0])
    expect(compositeGlass([.3, .2, .1, .5], [shell])).toEqual(compositeGlass([.3, .2, .1, .5], []))
  }
})

test("Beer–Lambert монотонен по толщине, плотности и числу оболочек", () => {
  const background = [.5, .5, .5, 1] as const
  const tint = [.3, .5, .8] as const
  const shell = glassShell(tint, .1, 1, 1.5, 1)
  const first = compositeGlass(background, [shell])
  for (const fragments of [[shell, shell], [glassShell(tint, .5, 1, 1.5, 1)], [glassShell(tint, .1, 5, 1.5, 1)]]) {
    const next = compositeGlass(background, fragments)
    expect(next.slice(0, 3).every((value, channel) => value < first[channel]!)).toBeTrue()
  }
  expect(glassShell([1, 1, 1], 1, 0, 1.5, .05).depth[0]).toBeGreaterThan(glassShell([1, 1, 1], 1, 0, 1.5, 1).depth[0])
})

test("порядок batches не меняет цвет и alpha; opacity0 не отражает", () => {
  const fragments = [glassShell([.3, .8, .9], .2, 1, 1.5, .7, [.03, .04, .05]), glassShell([.9, .4, .5], .3, 2, 1.3, .4, [.01, .05, .02])]
  const forward = compositeGlass([.1, .04, .06, .25], fragments)
  const reverse = compositeGlass([.1, .04, .06, .25], fragments.toReversed())
  forward.forEach((value, channel) => expect(value).toBeCloseTo(reverse[channel]!, 12))
  const background = [.1, .02, .06, .25] as const
  compositeGlass(background, [glassShell([0, 0, 0], 0, 100, 3, 0, [64, 64, 64])]).forEach((value, channel) => expect(value).toBeCloseTo(background[channel]!, 12))
})

test("encoded premultiplied unorm фон проходит linear roundtrip без изменения", () => {
  for (const alpha of [0, .1, .5, 1]) {
    const source = [.7 * alpha, .3 * alpha, .05 * alpha, alpha] as const
    compositeGlass(source, []).forEach((value, channel) => expect(value).toBeCloseTo(source[channel]!, 12))
  }
  for (const color of [0, .001, .04, .1, .5, 1]) expect(linearToSrgb(srgbToLinear(color))).toBeCloseTo(color, 12)
})

test("нулевые/крайние значения и насыщение FP16 не дают NaN даже при большом overdraw", () => {
  const stress = glassShell([0, .0001, 1], 1, 100, 3, 0, [64, 64, 64])
  const result = compositeGlass([0, 0, 0, 0], Array.from({length: 100000}, () => stress))
  expect(result.every(value => Number.isFinite(value) && value >= 0 && value <= 1)).toBeTrue()
  const overflow: GlassAccumulation = {depth: [Infinity, Infinity, Infinity, Infinity], reflection: [Infinity, Infinity, Infinity, Infinity]}
  expect(compositeGlass([0, 0, 0, 0], [overflow]).every(Number.isFinite)).toBeTrue()
  const invalid = glassShell([NaN, Infinity, -1], NaN, Infinity, NaN, NaN, [NaN, Infinity, -1])
  expect([...invalid.depth, ...invalid.reflection].every(Number.isFinite)).toBeTrue()
})

test("single-sample OIT проверяет каждый opaque MSAA sample и composition ограничивает FP16 до деления", () => {
  const shader = glassShader(4)
  expect(shader).toContain("texture_depth_multisampled_2d")
  expect(shader).toContain("sampleIndex < 4")
  expect(shader).toContain("position.z < textureLoad(opaqueDepth, pixel, sampleIndex)")
  expect(shader).toContain("visible / 4.0")
  expect(shader).toContain("presentationClipCoverage")
  expect(shader).not.toContain("@glass-")
  expect(glassShader(1)).toContain("texture_depth_2d")
  expect(glassCompositeShader).toContain("min(textureLoad(reflection, pixel, 0), vec4<f32>(FP16_MAX))")
  expect(glassCompositeShader).toContain("base.rgb / max(base.a")
})
