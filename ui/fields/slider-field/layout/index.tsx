/**
Числовой договор размеров sliderField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SliderFieldDensity} from "@ui-fields/slider-field"
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

const sliderFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: SliderFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    return labelledFieldHeight(
      fieldDensityHeight(options.density ?? "regular"),
      options.label === true
    )
  }
})

export default sliderFieldLayout
