/**
Числовой договор размеров checkboxField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

const checkboxFieldLayout = Object.freeze({
  height(options: Readonly<{label?: boolean | undefined}> = {}): number {
    return labelledFieldHeight(fieldMetric("field-checkbox-height"), options.label === true)
  }
})

export default checkboxFieldLayout
