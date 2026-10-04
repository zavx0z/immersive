/**
Самостоятельные представления ноды разделяют адрес, выбор, видимость и активацию.
Параметры, содержимое и описание диаграммы остаются в собственных протоколах участников.
Числовая геометрия принадлежит отдельным владельцам @node-geometry/*.

@packageDocumentation
*/
export type {ImmersiveNodesNode} from "./contract"
export {default as DiagramNode} from "@immersive-nodes-node/diagram"
export type {ImmersiveNodesNodeDiagram} from "@immersive-nodes-node/diagram"
export {default as ParameterNode} from "@immersive-nodes-node/parameter"
export type {ImmersiveNodesNodeParameter} from "@immersive-nodes-node/parameter"
export {default as ContentNode} from "@immersive-nodes-node/content"
export type {ImmersiveNodesNodeContent} from "@immersive-nodes-node/content"
