/**
Проверяемая высота составного поля выбора цвета.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import fieldMetric from "@immersive-ui-field-metric/read"

export default function colorPickerFieldHeight(): number {
  const channelCount = fieldMetric("field-color-picker-channel-count")
  const composedHeight = fieldMetric("field-color-picker-swatch-height") +
    channelCount * fieldMetric("field-color-picker-channel-height") +
    channelCount * fieldMetric("field-color-picker-gap") +
    2 * fieldMetric("field-color-picker-padding") +
    2 * fieldMetric("field-color-picker-border-width")
  const height = fieldMetric("field-color-picker-height")
  if (height !== composedHeight) {
    throw new Error(`ColorPickerField height ${height} must equal its composed height ${composedHeight}`)
  }
  return height
}
