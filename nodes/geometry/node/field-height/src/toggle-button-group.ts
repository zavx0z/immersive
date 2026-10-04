/**
Оценка строки выбора для числового плана Node при базовой теме.
Сам ToggleButtonGroup размещается через CSS; этот helper не задаёт его геометрию.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentButtonToggleGroup} from "@zavx0z/immersive-ui-component-button-toggle-group"
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"
import resolveFieldDensity from "@zavx0z/immersive-ui-field-metric-resolve-density"

const toggleButtonGroupLayout = Object.freeze({
  height(options: Readonly<{
    density?: Zavx0zImmersiveUiComponentButtonToggleGroup.Input["density"] | undefined
    label?: boolean | undefined
  }> = {}): number {
    resolveFieldDensity(options.density, "regular", "ToggleButtonGroup")
    return labelledFieldHeight(fieldMetric("field-toggle-button-height"), options.label === true)
  }
})

export default toggleButtonGroupLayout
