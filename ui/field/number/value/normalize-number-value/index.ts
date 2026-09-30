/**
Нормализация числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NormalizeNumberValueInput} from "./contract/input"
import type {NumberValueOptions} from "./contract/types"
import finiteBound from "@ui-fields-number-value/finite-bound"
import roundedNumber from "@ui-fields-number-value/rounded-number"
import validNumberStep from "@ui-fields-number-value/valid-number-step"

export default function normalizeNumberValue(
  value: NormalizeNumberValueInput[0],
  options: NormalizeNumberValueInput[1] = {}
): number {
  const minimum = finiteBound(options.min, Number.NEGATIVE_INFINITY)
  const maximum = Math.max(minimum, finiteBound(options.max, Number.POSITIVE_INFINITY))
  const finite = Number.isFinite(value) ? value : finiteBound(options.min, 0)
  const clamped = Math.min(maximum, Math.max(minimum, finite))
  const step = validNumberStep(options.step)
  const stepBase = Number.isFinite(minimum) ? minimum : 0
  const stepped = step === undefined
    ? clamped
    : stepBase + Math.round((clamped - stepBase) / step) * step
  return roundedNumber(Math.min(maximum, Math.max(minimum, stepped)))
}

export type {NumberValueOptions} from "./contract/types"

export type {NormalizeNumberValueInput} from "./contract/input"
