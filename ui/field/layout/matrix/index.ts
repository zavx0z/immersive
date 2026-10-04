/**
Числовой договор размеров matrixField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentFieldMatrix} from "@zavx0z/immersive-ui-component-field-matrix"
type MatrixFieldDensity = NonNullable<Zavx0zImmersiveUiComponentFieldMatrix.Input["density"]>
import matrixFieldHeight from "@zavx0z/immersive-ui-field-metric-matrix-height"

const matrixFieldLayout = Object.freeze({
  height(options: Readonly<{
    size: number
    density?: MatrixFieldDensity | undefined
  }>): number {
    return matrixFieldHeight(options.size, options.density ?? "regular")
  }
})

export default matrixFieldLayout
