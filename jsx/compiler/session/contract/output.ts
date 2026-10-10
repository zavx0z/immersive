import type {CapabilityUsage} from "../src/capability-usage.ts"

/** Неизменённый участок входного текста; сгенерированные области не имеют исходной позиции. */
export type JsxSourceRange = Readonly<{
  generatedStart: number
  generatedEnd: number
  sourceStart: number
}>

/**
Готовый TypeScript-код и наблюдения одной успешной компиляции.

@property code - JSX заменён общим compiled ABI; type-only imports остаются
типами до штатного удаления транслятором TypeScript/Bun.

@property capabilityUsages - Использованные DOM/CSS возможности с исходными позициями.

*/
export type JsxCompileResult = Readonly<{
  capabilityUsages: readonly CapabilityUsage[]
  code: string
  /** Точные линейные участки code относительно текста, переданного compileFile. */
  sourceRanges: readonly JsxSourceRange[]
}>
