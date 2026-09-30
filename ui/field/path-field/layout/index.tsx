/**
Числовой договор размеров pathField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {PathFieldDensity} from "@ui-fields/path-field"
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import fieldMetric from "@ui-fields-metrics/field-metric"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

const pathFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: PathFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    const height = options.density === "compact"
      ? fieldMetric("field-path-height-compact")
      : fieldDensityHeight("regular")
    return labelledFieldHeight(height, options.label === true)
  }
})

export default pathFieldLayout
