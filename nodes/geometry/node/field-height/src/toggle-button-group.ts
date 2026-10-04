/**
Оценка строки выбора для числового плана Node при базовой теме.
Сам ToggleButtonGroup размещается через CSS; этот helper не задаёт его геометрию.

@packageDocumentation
*/
import type {ImmersiveUiComponentButtonToggleGroup} from "@zavx0z/immersive-ui-component-button-toggle-group"
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"
import resolveFieldDensity from "@zavx0z/immersive-ui-field-metric-resolve-density"

const toggleButtonGroupLayout = Object.freeze({
  height(options: Readonly<{
    density?: ImmersiveUiComponentButtonToggleGroup.Input["density"] | undefined
    label?: boolean | undefined
  }> = {}): number {
    resolveFieldDensity(options.density, "regular", "ToggleButtonGroup")
    return labelledFieldHeight(fieldMetric("field-toggle-button-height"), options.label === true)
  }
})

export default toggleButtonGroupLayout
