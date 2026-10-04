/**
Числовой договор размеров referenceField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentFieldReference} from "@zavx0z/immersive-ui-component-field-reference"
type ReferenceFieldDensity = NonNullable<Zavx0zImmersiveUiComponentFieldReference.Input["density"]>
import fieldDensityHeight from "@zavx0z/immersive-ui-field-metric-density-height"
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

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
