/**
Самостоятельные представления ноды разделяют адрес, выбор, видимость и активацию.
Параметры, содержимое и описание диаграммы остаются в собственных протоколах участников.
Числовая геометрия принадлежит отдельным владельцам @node-geometry/*.

@packageDocumentation
*/
export type {ImmersiveNodesNode} from "./contract"
export {default as DiagramNode} from "@zavx0z/immersive-nodes-node-diagram"
export type {ImmersiveNodesNodeDiagram} from "@zavx0z/immersive-nodes-node-diagram"
export {default as ParameterNode} from "@zavx0z/immersive-nodes-node-parameter"
export type {ImmersiveNodesNodeParameter} from "@zavx0z/immersive-nodes-node-parameter"
export {default as ContentNode} from "@zavx0z/immersive-nodes-node-content"
export type {ImmersiveNodesNodeContent} from "@zavx0z/immersive-nodes-node-content"
