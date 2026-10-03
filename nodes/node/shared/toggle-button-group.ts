/**
Оценка строки выбора для числового плана Node при базовой теме.
Сам ToggleButtonGroup размещается через CSS; этот helper не задаёт его геометрию.

@packageDocumentation
*/
import type {UiButtonsToggleButtonGroup} from "@ui-buttons/toggle-button-group"
import fieldMetric from "@ui-fields-metrics/field-metric"
import labelledFieldHeight from "@ui-fields-metrics/labelled-field-height"
import resolveFieldDensity from "@ui-fields-metrics/resolve-field-density"

const toggleButtonGroupLayout = Object.freeze({
  height(options: Readonly<{
    density?: UiButtonsToggleButtonGroup.Input["density"] | undefined
    label?: boolean | undefined
  }> = {}): number {
    resolveFieldDensity(options.density, "regular", "ToggleButtonGroup")
    return labelledFieldHeight(fieldMetric("field-toggle-button-height"), options.label === true)
  }
})

export default toggleButtonGroupLayout
