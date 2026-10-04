/**
Числовой договор размеров textField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldDensityHeight from "@immersive-ui-field-metric/density-height"
import labelledFieldHeight from "@immersive-ui-field-metric/labelled-height"

const textFieldLayout = Object.freeze({
  height(options: Readonly<{label?: boolean | undefined}> = {}): number {
    return labelledFieldHeight(fieldDensityHeight("compact"), options.label === true)
  }
})

export default textFieldLayout
