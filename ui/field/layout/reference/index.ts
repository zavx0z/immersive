/**
Числовой договор размеров referenceField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentFieldReference} from "@immersive-ui-component-field/reference"
type ReferenceFieldDensity = NonNullable<ImmersiveUiComponentFieldReference.Input["density"]>
import fieldDensityHeight from "@immersive-ui-field-metric/density-height"
import fieldMetric from "@immersive-ui-field-metric/read"
import labelledFieldHeight from "@immersive-ui-field-metric/labelled-height"

const referenceFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: ReferenceFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    const height = options.density === "compact"
      ? fieldMetric("field-reference-height-compact")
      : fieldDensityHeight("regular")
    return labelledFieldHeight(height, options.label === true)
  }
})

export default referenceFieldLayout
