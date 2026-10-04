/**
Числовой договор размеров cycleField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentFieldCycle} from "@immersive-ui-component-field/cycle"
type CycleFieldDensity = NonNullable<ImmersiveUiComponentFieldCycle.Input["density"]>
import fieldDensityHeight from "@immersive-ui-field-metric/density-height"
import labelledFieldHeight from "@immersive-ui-field-metric/labelled-height"

const cycleFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: CycleFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    return labelledFieldHeight(
      fieldDensityHeight(options.density ?? "regular"),
      options.label === true
    )
  }
})

export default cycleFieldLayout
