/**
Нормализация числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldNumberValueNormalize as Contract} from "./contract"
import type {NumberValueOptions} from "./contract/types"
import finiteBound from "@zavx0z/immersive-ui-field-number-value-finite-bound"
import roundedNumber from "@zavx0z/immersive-ui-field-number-value-round"
import validNumberStep from "@zavx0z/immersive-ui-field-number-value-valid-step"

export default function normalizeNumberValue(
  value: Contract.Input[0],
  options: Contract.Input[1] = {}
): Contract.Output {
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

export type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "./contract"
