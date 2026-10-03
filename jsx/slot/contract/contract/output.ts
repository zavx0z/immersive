import type {SlotContractDiagnostic} from "./diagnostic.ts"

/**
Принятые отношения слотов и сведения, необходимые сценарию для сохранения результата проверки.

@property diagnostics - По одному предупреждению на компонент со слотами без схемы.
Отсутствие точек вставки не требует предупреждения.

@property dependencyPaths - Исходники деклараций, повлиявших на разрешение контрактов.
Сохранённая проверка относится к этим версиям, включая type-only зависимости.
*/
export interface ValidateSlotContractsOutput {
  readonly diagnostics: readonly SlotContractDiagnostic[]
  readonly dependencyPaths: readonly string[]
}
