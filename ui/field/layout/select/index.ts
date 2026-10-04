/**
Числовой договор размеров selectField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentFieldSelect} from "@zavx0z/immersive-ui-component-field-select"
type SelectFieldDensity = NonNullable<Zavx0zImmersiveUiComponentFieldSelect.Input["density"]>
import fieldDensityHeight from "@zavx0z/immersive-ui-field-metric-density-height"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

const selectFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: SelectFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    return labelledFieldHeight(
      fieldDensityHeight(options.density ?? "compact"),
      options.label === true
    )
  }
})

export default selectFieldLayout
