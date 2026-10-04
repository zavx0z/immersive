/**
Числовой договор размеров colorField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldDensityHeight from "@immersive-ui-field-metric/density-height"

const colorFieldLayout = Object.freeze({
  height(): number {
    return fieldDensityHeight("regular")
  }
})

export default colorFieldLayout
