/**
Допустимый положительный конечный шаг числового поля.
Некорректное и отсутствующее значение возвращаются как undefined, чтобы вызывающий
владелец мог применить свой шаг по умолчанию.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValueStepValid as Contract} from "./contract"

export default function validNumberStep(value: Contract.Input[0]): Contract.Output {
  return Number.isFinite(value) && value! > 0 ? value : undefined
}

export type {ImmersiveUiFieldNumberValueStepValid} from "./contract"
