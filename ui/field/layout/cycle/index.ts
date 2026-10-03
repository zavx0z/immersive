/**
Числовой договор размеров cycleField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsCycleField} from "@ui-fields/cycle-field"
type CycleFieldDensity = NonNullable<UiFieldsCycleField.Input["density"]>
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

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
