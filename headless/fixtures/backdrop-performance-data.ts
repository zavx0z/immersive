/** Чистые параметры и статистика native benchmark, без загрузки GPU. */
export type Phase = "none" | "one" | "three"
export type Density = "high" | "low"
export type Motion = "moving" | "static" | "foreground"
export type BenchmarkConfig = {
  label: string
  base: string | null
  output: string | null
  resolutions: readonly {
    width: number
    height: number
  }[]
  densities: readonly Density[]
  motions: readonly Motion[]
  warmup: number
  samples: number
  sigma: number
  first: "forward" | "reverse"
}

export function parseConfig(args: readonly string[]): BenchmarkConfig {
  const values = new Map<string, string>()
  const known = new Set(["label", "base", "output", "resolutions", "densities", "motion", "warmup", "samples", "sigma", "first"])
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index]!
    const name = option.startsWith("--") ? option.slice(2) : ""
    const value = args[index + 1]
    if (!known.has(name) || value === undefined || value.startsWith("--") || values.has(name)) {
      throw new Error(`Invalid or repeated benchmark option: ${option}`)
    }
    values.set(name, value)
  }
  const integer = (key: string, fallback: number, minimum: number) => {
    const number = Number(values.get(key) ?? fallback)
    if (!Number.isSafeInteger(number) || number < minimum) {
      throw new Error(`--${key} must be an integer >= ${minimum}`)
    }
    return number
  }
  const sigma = Number(values.get("sigma") ?? 8)
  if (!Number.isFinite(sigma) || sigma <= 0) {
    throw new Error("--sigma must be positive and finite")
  }
  const first = values.get("first") ?? "forward"
  if (first !== "forward" && first !== "reverse") {
    throw new Error("--first must be forward or reverse")
  }
  const densities = (values.get("densities") ?? "high,low").split(",")
  if (densities.length === 0 || new Set(densities).size !== densities.length || densities.some(value => value !== "high" && value !== "low")) {
    throw new Error("--densities must contain high and/or low once")
  }
  const motion = values.get("motion") ?? "moving"
  if (!["moving", "static", "foreground", "both", "all"].includes(motion)) {
    throw new Error("--motion must be moving, static, foreground, both or all")
  }
  const resolutions = (values.get("resolutions") ?? "1280x720,2730x2176").split(",").map(value => {
    const match = /^(\d+)x(\d+)$/u.exec(value)
    if (!match) {
      throw new Error("--resolutions must contain WIDTHxHEIGHT pairs")
    }
    const width = Number(match[1])
    const height = Number(match[2])
    if (![width, height].every(number => Number.isSafeInteger(number) && number > 0)) {
      throw new Error("Resolution dimensions must be positive integers")
    }
    return {width, height}
  })
  return {label: values.get("label") ?? "variant", base: values.get("base") ?? null, output: values.get("output") ?? null,
    resolutions, densities: densities as Density[], motions: motion === "all" ? ["moving", "static", "foreground"]
      : motion === "both" ? ["moving", "static"] : [motion as Motion],
    warmup: integer("warmup", 4, 0), samples: integer("samples", 12, 1), sigma, first}
}

/** Одинаковые позы для каждой фазы: foreground меняет только последний DOM child. */
export function frameMotion(motion: Motion, frame: number) {
  return {worldOffsetCssPx: motion === "moving" ? Math.sin(frame / 10) * 10 : 0,
    childLeftCssPx: motion === "foreground" ? 24 + frame % 11 * 2 : 24}
}

export function orders(first: BenchmarkConfig["first"]): readonly (readonly Phase[])[] {
  const forward = ["none", "one", "three"] as const
  const reverse = ["three", "one", "none"] as const
  return first === "forward" ? [forward, reverse] : [reverse, forward]
}

/** Медиана и p95 по ближайшему рангу; исходный массив сохраняет порядок измерений. */
export function summarize(values: readonly number[]) {
  if (values.length === 0 || values.some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error("Samples must be finite, non-negative and non-empty")
  }
  const sorted = values.toSorted((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return {count: values.length, medianMs: sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2,
    p95Ms: sorted[Math.ceil(sorted.length * .95) - 1]!}
}
