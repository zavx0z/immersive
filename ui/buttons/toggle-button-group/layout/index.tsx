/**
Числовой договор размеров toggleButtonGroup.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ToggleButtonGroupDensity} from "@ui-buttons/toggle-button-group"
import fieldMetric from "@ui-fields-metrics/field-metric"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"
import resolveFieldDensity from "@ui-fields-metrics/resolve-field-density"

const toggleButtonGroupLayout = Object.freeze({
  height(options: Readonly<{
    density?: ToggleButtonGroupDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    resolveFieldDensity(options.density, "regular", "ToggleButtonGroup")
    return labelledFieldHeight(fieldMetric("field-toggle-button-height"), options.label === true)
  }
})

export default toggleButtonGroupLayout
