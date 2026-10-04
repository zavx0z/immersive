/**
Числовой договор размеров pathField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentFieldPath} from "@immersive-ui-component-field/path"
type PathFieldDensity = NonNullable<ImmersiveUiComponentFieldPath.Input["density"]>
import fieldDensityHeight from "@immersive-ui-field-metric/density-height"
import fieldMetric from "@immersive-ui-field-metric/read"
import labelledFieldHeight from "@immersive-ui-field-metric/labelled-height"

const pathFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: PathFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    const height = options.density === "compact"
      ? fieldMetric("field-path-height-compact")
      : fieldDensityHeight("regular")
    return labelledFieldHeight(height, options.label === true)
  }
})

export default pathFieldLayout
