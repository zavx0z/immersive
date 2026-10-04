/**
Числовой договор размеров numberField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldDensityHeight from "@immersive-ui-field-metric/density-height"

const numberFieldLayout = Object.freeze({
  height(): number {
    return fieldDensityHeight("compact")
  }
})

export default numberFieldLayout
