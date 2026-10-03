/**
Числовой договор размеров switchField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldMetric from "@ui-fields-metrics/field-metric"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

const switchFieldLayout = Object.freeze({
  height(options: Readonly<{label?: boolean | undefined}> = {}): number {
    return labelledFieldHeight(fieldMetric("field-switch-height"), options.label === true)
  }
})

export default switchFieldLayout
