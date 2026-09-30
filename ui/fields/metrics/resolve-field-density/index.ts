/**
Проверка и выбор плотности размещения поля.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ResolveFieldDensityInput} from "./contract/input"
import type {FieldDensity} from "./contract/types.ts"

export type {FieldDensity} from "./contract/types"

export default function resolveFieldDensity(
  value: ResolveFieldDensityInput[0],
  fallback: ResolveFieldDensityInput[1],
  owner: ResolveFieldDensityInput[2]
): FieldDensity {
  const density = value ?? fallback
  if (density !== "regular" && density !== "compact") {
    throw new Error(`Unknown ${owner} density: ${density}`)
  }
  return density
}

export type {ResolveFieldDensityInput} from "./contract/input"
