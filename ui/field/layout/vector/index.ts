/**
Числовой договор размеров vectorField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsVectorField} from "@ui-fields/vector-field"
type VectorFieldDensity = NonNullable<UiFieldsVectorField.Input["density"]>
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

const vectorFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: VectorFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    return labelledFieldHeight(
      fieldDensityHeight(options.density ?? "regular"),
      options.label === true
    )
  }
})

export default vectorFieldLayout
