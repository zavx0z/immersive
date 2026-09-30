/**
Числовой договор размеров matrixField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {MatrixFieldDensity} from "@ui-fields/matrix-field"
import matrixFieldHeight from "@ui-fields-metrics/matrix-field-height"

const matrixFieldLayout = Object.freeze({
  height(options: Readonly<{
    size: number
    density?: MatrixFieldDensity | undefined
  }>): number {
    return matrixFieldHeight(options.size, options.density ?? "regular")
  }
})

export default matrixFieldLayout
