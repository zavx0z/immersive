/**
Числовой договор размеров fieldGroup.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {FieldGroupDensity} from "@ui-fields/field-group"
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

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
