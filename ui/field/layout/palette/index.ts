/**
Высота панели каналов и палитры цвета в единицах раскладки интерфейса.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import colorPickerFieldHeight from "@zavx0z/immersive-ui-field-metric-color-picker-height"

const colorPickerFieldLayout = Object.freeze({
  height(): number {
    return colorPickerFieldHeight()
  }
})

export default colorPickerFieldLayout
