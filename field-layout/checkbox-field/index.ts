/**
Числовой договор размеров checkboxField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldMetric from "@ui-fields-metrics/field-metric"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

const checkboxFieldLayout = Object.freeze({
  height(options: Readonly<{label?: boolean | undefined}> = {}): number {
    return labelledFieldHeight(fieldMetric("field-checkbox-height"), options.label === true)
  }
})

export default checkboxFieldLayout
