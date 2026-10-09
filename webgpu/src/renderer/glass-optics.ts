/** Общие пределы shader и численного эталона тонких оболочек. */
export const GLASS_ACCUMULATION_SCALE = 1 / 64
export const GLASS_MAX_OPTICAL_DEPTH = 20
export const GLASS_MAX_RADIANCE = 64
export const GLASS_FP16_MAX = 65504
export type GlassRgb = readonly [number, number, number]
export type GlassAccumulation = Readonly<{depth: readonly [number, number, number, number], reflection: readonly [number, number, number, number]}>

const bounded = (value: number, maximum: number) => Number.isNaN(value) ? 0 : Math.min(maximum, Math.max(0, value))
export const srgbToLinear = (value: number) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
export const glassAbsorptionChannel = (value: number) => -Math.log(Math.max(.001, srgbToLinear(bounded(value, 1))))
export const linearToSrgb = (value: number) => value <= .0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - .055

/** Численный эталон shader: цветное поглощение не создаёт исходящего света. */
export function glassShell(tint: GlassRgb, density: number, thickness: number, ior: number, facing: number, reflectedLight: GlassRgb = [0, 0, 0]): GlassAccumulation {
  const opacity = bounded(density, 1)
  const cosine = bounded(facing, 1)
  const index = 1 + bounded(ior - 1, 2)
  const f0 = ((index - 1) / (index + 1)) ** 2
  const fresnel = index === 1 ? 0 : f0 + (1 - f0) * (1 - cosine) ** 5
  const reflectionDepth = -Math.log(Math.max(1e-6, 1 - opacity * fresnel))
  const depth = tint.map(channel => bounded(glassAbsorptionChannel(channel) * bounded(thickness, 100) * opacity / Math.max(.1, cosine) + reflectionDepth, GLASS_MAX_OPTICAL_DEPTH)) as [number, number, number]
  const coverageDepth = Math.max(...depth)
  const coverage = -Math.expm1(-coverageDepth)
  return {
    depth: [...depth.map(value => value * GLASS_ACCUMULATION_SCALE), coverageDepth * GLASS_ACCUMULATION_SCALE] as [number, number, number, number],
    reflection: [...reflectedLight.map(value => bounded(value, GLASS_MAX_RADIANCE) * opacity * GLASS_ACCUMULATION_SCALE), coverage * GLASS_ACCUMULATION_SCALE] as [number, number, number, number],
  }
}

/** Цвет входа/выхода — premultiplied encoded sRGB, как у текущего canvas unorm. */
export function compositeGlass(background: readonly [number, number, number, number], fragments: readonly GlassAccumulation[]): readonly [number, number, number, number] {
  const sum = (name: keyof GlassAccumulation, channel: number) => bounded(fragments.reduce((total, fragment) => total + fragment[name][channel]!, 0), GLASS_FP16_MAX)
  const coverage = -Math.expm1(-Math.min(GLASS_MAX_OPTICAL_DEPTH, sum("depth", 3) / GLASS_ACCUMULATION_SCALE))
  const baseAlpha = bounded(background[3], 1)
  const alpha = baseAlpha + (1 - baseAlpha) * coverage
  const weight = Math.max(1e-6, sum("reflection", 3))
  const rgb = [0, 1, 2].map(channel => {
    const base = srgbToLinear(bounded(background[channel]! / Math.max(1e-6, baseAlpha), 1)) * baseAlpha
    const transmission = Math.exp(-Math.min(GLASS_MAX_OPTICAL_DEPTH, sum("depth", channel) / GLASS_ACCUMULATION_SCALE))
    const reflection = bounded(sum("reflection", channel) / weight, GLASS_MAX_RADIANCE) * coverage
    return bounded(linearToSrgb((base * transmission + reflection) / Math.max(1e-6, alpha)), 1) * alpha
  })
  return [rgb[0]!, rgb[1]!, rgb[2]!, alpha]
}
