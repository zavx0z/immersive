/**
Проверка и выбор плотности размещения поля.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldMetricResolveDensity as Contract} from "./contract"


export default function resolveFieldDensity(
  value: Contract.Input[0],
  fallback: Contract.Input[1],
  owner: Contract.Input[2]
): Contract.Output {
  const density = value ?? fallback
  if (density !== "regular" && density !== "compact") {
    throw new Error(`Unknown ${owner} density: ${density}`)
  }
  return density
}

export type {Zavx0zImmersiveUiFieldMetricResolveDensity} from "./contract"
