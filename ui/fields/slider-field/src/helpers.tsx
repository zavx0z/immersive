import type {SliderFieldProps} from "../contract/input.ts"

/** Частная подготовка поле интерфейса: числовой диапазон. */
export function validateSliderField(props: SliderFieldProps): number {
  if (![props.value, props.min, props.max].every(Number.isFinite)) {
    throw new TypeError("SliderField values must be finite")
  }
  if (props.min >= props.max) throw new RangeError("SliderField min must be less than max")
  const step = props.step ?? 0.1
  if (!Number.isFinite(step) || step <= 0) throw new RangeError("SliderField step must be positive")
  return step
}
