/**
Определяет номинальную высоту подготовленного представления параметра.

@packageDocumentation
*/
import type {Zavx0zImmersiveNodesGeometryNodeFieldHeight as Contract} from "./contract"
export type {Zavx0zImmersiveNodesGeometryNodeFieldHeight} from "./contract"

import checkboxFieldLayout from "@zavx0z/immersive-ui-field-layout-checkbox"
import collectionFieldLayout from "@zavx0z/immersive-ui-field-layout-collection"
import colorFieldLayout from "@zavx0z/immersive-ui-field-layout-color"
import cycleFieldLayout from "@zavx0z/immersive-ui-field-layout-cycle"
import matrixFieldLayout from "@zavx0z/immersive-ui-field-layout-matrix"
import numberFieldLayout from "@zavx0z/immersive-ui-field-layout-number"
import toggleButtonGroupLayout from "./src/toggle-button-group"
import pathFieldLayout from "@zavx0z/immersive-ui-field-layout-path"
import referenceFieldLayout from "@zavx0z/immersive-ui-field-layout-reference"
import selectFieldLayout from "@zavx0z/immersive-ui-field-layout-select"
import sliderFieldLayout from "@zavx0z/immersive-ui-field-layout-slider"
import switchFieldLayout from "@zavx0z/immersive-ui-field-layout-switch"
import textFieldLayout from "@zavx0z/immersive-ui-field-layout-text"
import vectorFieldLayout from "@zavx0z/immersive-ui-field-layout-vector"
import socketMetrics from "@zavx0z/immersive-nodes-model-socket-metrics"
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
