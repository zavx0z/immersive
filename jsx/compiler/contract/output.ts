import type {ValidateSlotContractsOutput} from "@jsx/slot-contract"
import type {CapabilityUsage} from "../src/capability-usage.ts"

/**
Готовый TypeScript-код и наблюдения одной успешной компиляции.

@property code - JSX заменён общим compiled ABI; type-only imports остаются
типами до штатного удаления транслятором TypeScript/Bun.

@property capabilityUsages - Использованные DOM/CSS возможности с исходными позициями.

@property diagnostics - Неблокирующие рекомендации указать JSX.Element<Slots>.
Ошибки явных контрактов приводят к исключению и не возвращают успешный результат.
*/
export type JsxCompileResult = Readonly<{
  capabilityUsages: readonly CapabilityUsage[]
  /** Нефатальные замечания автора; одинаковый cache hit сохраняет тот же результат. */
  diagnostics: ValidateSlotContractsOutput["diagnostics"]
  code: string
}>
