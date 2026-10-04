/**
Общие размеры интервалов между параметрами и текстового вывода.
Числовой план ноды и представление параметра используют один набор значений.

@packageDocumentation
*/
import type {Zavx0zImmersiveNodesGeometryParameter as Contract} from "./contract"
export type {Zavx0zImmersiveNodesGeometryParameter} from "./contract"

const metrics: Contract.Output = Object.freeze({
  NODE_PARAMETER_SPACING_SMALL: 1,
  NODE_PARAMETER_SPACING_MEDIUM: 5,
  PARAMETER_OUTPUT_HEIGHT: 20,
})

export default metrics
