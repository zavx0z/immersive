/**
Числовой договор размеров pathField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentFieldPath} from "@zavx0z/immersive-ui-component-field-path"
type PathFieldDensity = NonNullable<Zavx0zImmersiveUiComponentFieldPath.Input["density"]>
import fieldDensityHeight from "@zavx0z/immersive-ui-field-metric-density-height"
import fieldMetric from "@zavx0z/immersive-ui-field-metric-read"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

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
