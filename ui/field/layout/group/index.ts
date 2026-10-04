/**
Числовой договор размеров fieldGroup.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentFieldGroup} from "@zavx0z/immersive-ui-component-field-group"
type FieldGroupDensity = NonNullable<Zavx0zImmersiveUiComponentFieldGroup.Input["density"]>
import fieldDensityHeight from "@zavx0z/immersive-ui-field-metric-density-height"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

const fieldGroupLayout = Object.freeze({
  height(options: Readonly<{
    density?: FieldGroupDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    return labelledFieldHeight(
      fieldDensityHeight(options.density ?? "regular"),
      options.label === true
    )
  }
})

export default fieldGroupLayout
