/**
Числовой договор размеров vectorField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentFieldVector} from "@zavx0z/immersive-ui-component-field-vector"
type VectorFieldDensity = NonNullable<Zavx0zImmersiveUiComponentFieldVector.Input["density"]>
import fieldDensityHeight from "@zavx0z/immersive-ui-field-metric-density-height"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

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
