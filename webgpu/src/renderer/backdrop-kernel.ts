export type BackdropKernelMode = "linear" | "nearestDepth"

/** Смещения заданы в texels исходной оси, веса остаются ненормализованными. */
export type BackdropKernel = Readonly<{
  offsets: readonly number[]
  weights: readonly number[]
  count: number
}>

const TAP_RADIUS = 9
const TAP_COUNT = TAP_RADIUS * 2 + 1
const gaussianWeights = Object.freeze(Array.from({length: TAP_COUNT}, (_, index) =>
  Math.exp(-.5 * ((index - TAP_RADIUS) / 3) ** 2)))

const seal = (offsets: number[], weights: readonly number[]): BackdropKernel =>
  Object.freeze({offsets: Object.freeze(offsets), weights: Object.freeze(weights), count: offsets.length})

/**
 * Сворачивает V Gaussian без изменения его дискретного результата.
 * Source и destination должны иметь одинаковую сетку и texel-center UV.
 * H с отличающейся сеткой не удовлетворяет этому контракту.
 *
 * Linear сначала собирает коэффициенты отдельных texels, затем объединяет
 * соседнюю пару одной билинейной выборкой. NearestDepth объединяет только
 * совпавшие texels: depth/validity проверяется до нормализации каждой выборки.
 * Вблизи half-texel границы оставляет исходные taps из-за округления GPU UV.
 * Clamp-to-edge совместим с обоими преобразованиями. Кэша у функции нет.
 */
export function createBackdropKernel(
  sigma: number,
  sourcePixels: number,
  physicalPixels: number,
  mode: BackdropKernelMode,
): BackdropKernel {
  if (!Number.isFinite(sigma) || sigma < 0) throw new RangeError("Backdrop kernel sigma must be finite and non-negative")
  for (const [name, value] of [["sourcePixels", sourcePixels], ["physicalPixels", physicalPixels]] as const) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`Backdrop kernel ${name} must be a positive safe integer`)
  }
  if (mode !== "linear" && mode !== "nearestDepth") throw new TypeError("Unknown backdrop kernel mode")
  const step = sigma / 3 * (sourcePixels / physicalPixels)
  if (!Number.isFinite(step * TAP_RADIUS) || step * TAP_RADIUS >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Backdrop kernel offsets must be representable texels")
  }
  const offsets = Array.from({length: TAP_COUNT}, (_, index) => (index - TAP_RADIUS) * step)
  const original = () => seal(offsets, gaussianWeights)
  const coefficients = new Map<number, number>()
  const add = (offset: number, weight: number) => {
    if (weight > 0) coefficients.set(offset, (coefficients.get(offset) ?? 0) + weight)
  }
  if (mode === "nearestDepth") {
    for (let index = 0; index < TAP_COUNT; index++) {
      const offset = offsets[index]!
      // Запас включает Float32 округление UV, умноженного на размер texture.
      const epsilon = Math.max(1e-6, (sourcePixels + Math.abs(offset)) * 2 ** -21)
      if (Math.abs(offset - (Math.floor(offset) + .5)) <= epsilon) return original()
      add(Math.floor(offset + .5), gaussianWeights[index]!)
    }
  } else {
    for (let index = 0; index < TAP_COUNT; index++) {
      const offset = offsets[index]!, lower = Math.floor(offset), fraction = offset - lower
      add(lower, gaussianWeights[index]! * (1 - fraction))
      add(lower + 1, gaussianWeights[index]! * fraction)
    }
  }
  const ordered = [...coefficients].sort(([left], [right]) => left - right)
  const compactOffsets: number[] = [], compactWeights: number[] = []
  for (let index = 0; index < ordered.length; index++) {
    const [offset, weight] = ordered[index]!
    const next = ordered[index + 1]
    if (mode === "linear" && next?.[0] === offset + 1) {
      const total = weight + next[1]
      compactOffsets.push(offset + next[1] / total)
      compactWeights.push(total)
      index++
    } else {
      compactOffsets.push(offset)
      compactWeights.push(weight)
    }
  }
  return compactOffsets.length < TAP_COUNT ? seal(compactOffsets, compactWeights) : original()
}
