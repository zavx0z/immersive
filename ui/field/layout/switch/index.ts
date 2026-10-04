/**
Числовой договор размеров switchField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

const switchFieldLayout = Object.freeze({
  height(options: Readonly<{label?: boolean | undefined}> = {}): number {
    return labelledFieldHeight(fieldMetric("field-switch-height"), options.label === true)
  }
})

export default switchFieldLayout
