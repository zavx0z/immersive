import type {CapabilityUsage} from "../src/capability-usage.ts"

/**
Готовый TypeScript-код и наблюдения одной успешной компиляции.

@property code - JSX заменён общим compiled ABI; type-only imports остаются
типами до штатного удаления транслятором TypeScript/Bun.

@property capabilityUsages - Использованные DOM/CSS возможности с исходными позициями.

*/
export type JsxCompileResult = Readonly<{
  capabilityUsages: readonly CapabilityUsage[]
  code: string
}>
