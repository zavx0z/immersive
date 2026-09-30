/**
Числовой договор размеров referenceField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ReferenceFieldDensity} from "@ui-fields/reference-field"
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import fieldMetric from "@ui-fields-metrics/field-metric"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

const referenceFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: ReferenceFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    const height = options.density === "compact"
      ? fieldMetric("field-reference-height-compact")
      : fieldDensityHeight("regular")
    return labelledFieldHeight(height, options.label === true)
  }
})

export default referenceFieldLayout
