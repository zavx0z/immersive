/**
Числовой договор размеров vectorField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentFieldVector} from "@immersive-ui-component-field/vector"
type VectorFieldDensity = NonNullable<ImmersiveUiComponentFieldVector.Input["density"]>
import fieldDensityHeight from "@immersive-ui-field-metric/density-height"
import labelledFieldHeight from "@immersive-ui-field-metric/labelled-height"

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
