/**
Числовой договор размеров colorPickerField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import colorPickerFieldHeight from "@immersive-ui-field-metric/color-picker-height"

const colorPickerFieldLayout = Object.freeze({
  height(): number {
    return colorPickerFieldHeight()
  }
})

export default colorPickerFieldLayout
