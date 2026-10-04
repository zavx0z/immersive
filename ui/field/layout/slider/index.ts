/**
Числовой договор размеров sliderField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentFieldSlider} from "@zavx0z/immersive-ui-component-field-slider"
type SliderFieldDensity = NonNullable<Zavx0zImmersiveUiComponentFieldSlider.Input["density"]>
import fieldDensityHeight from "@zavx0z/immersive-ui-field-metric-density-height"
import labelledFieldHeight from "@zavx0z/immersive-ui-field-metric-labelled-height"

const sliderFieldLayout = Object.freeze({
  height(options: Readonly<{
    density?: SliderFieldDensity | undefined
    label?: boolean | undefined
  }> = {}): number {
    return labelledFieldHeight(
      fieldDensityHeight(options.density ?? "regular"),
      options.label === true
    )
  }
})

export default sliderFieldLayout
