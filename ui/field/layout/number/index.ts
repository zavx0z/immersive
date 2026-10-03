/**
Числовой договор размеров numberField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"

const numberFieldLayout = Object.freeze({
  height(): number {
    return fieldDensityHeight("compact")
  }
})

export default numberFieldLayout
