/**
Числовой договор размеров selectField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsSelectField} from "@ui-fields/select-field"
type SelectFieldDensity = NonNullable<UiFieldsSelectField.Input["density"]>
import fieldDensityHeight from "@ui-fields-metrics/field-density-height"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"

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
