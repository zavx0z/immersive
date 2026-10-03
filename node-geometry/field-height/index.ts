/**
Определяет номинальную высоту подготовленного представления параметра.

@packageDocumentation
*/
import type {NodeGeometryFieldHeight as Contract} from "./contract"
export type {NodeGeometryFieldHeight} from "./contract"

import checkboxFieldLayout from "@ui-fields-checkbox-field/layout"
import collectionFieldLayout from "@ui-fields-collection-field/layout"
import colorFieldLayout from "@ui-fields-color-field/layout"
import cycleFieldLayout from "@ui-fields-cycle-field/layout"
import matrixFieldLayout from "@ui-fields-matrix-field/layout"
import numberFieldLayout from "@ui-fields-number-field/layout"
import toggleButtonGroupLayout from "./src/toggle-button-group"
import pathFieldLayout from "@ui-fields-path-field/layout"
import referenceFieldLayout from "@ui-fields-reference-field/layout"
import selectFieldLayout from "@ui-fields-select-field/layout"
import sliderFieldLayout from "@ui-fields-slider-field/layout"
import switchFieldLayout from "@ui-fields-switch-field/layout"
import textFieldLayout from "@ui-fields-text-field/layout"
import vectorFieldLayout from "@ui-fields-vector-field/layout"
import socketMetrics from "@socket-values/metrics"
const {NODE_ROW_HEIGHT} = socketMetrics

/** Высота поля для существующего числового плана Node с базовой темой; реальное размещение Graph использует измеренный DOM. */
export default function projectedParameterFieldHeight(
  resolved: Contract.Input,
): Contract.Output {
  switch (resolved.kind) {
    case "checkbox": return checkboxFieldLayout.height()
    case "collection": return collectionFieldLayout.height({
      visibleRows: resolved.collection?.visibleRows,
      movable: false,
    })
    case "color": return colorFieldLayout.height()
    case "cycle": return cycleFieldLayout.height({density: "compact"})
    case "matrix": {
      if (resolved.matrix === null) throw new Error("Projected Matrix Parameter must have a resolved matrix")
      return matrixFieldLayout.height({size: resolved.matrix.length, density: "compact"})
    }
    case "number": return numberFieldLayout.height()
    case "option-group": return toggleButtonGroupLayout.height()
    case "output": return NODE_ROW_HEIGHT
    case "path": return pathFieldLayout.height({density: "compact"})
    case "reference": return referenceFieldLayout.height({density: "compact"})
    case "select": return selectFieldLayout.height({density: "compact"})
    case "slider": return sliderFieldLayout.height({density: "compact"})
    case "switch": return switchFieldLayout.height()
    case "text": return textFieldLayout.height()
    case "vector": return vectorFieldLayout.height({density: "compact"})
  }
}
