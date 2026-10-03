/**
Самостоятельные представления ноды разделяют адрес, выбор, видимость и активацию.
Параметры, содержимое и описание диаграммы остаются в собственных протоколах участников.
Числовая геометрия принадлежит отдельным владельцам @node-geometry/*.

@packageDocumentation
*/
export type {NodesNode} from "./contract"
export {default as DiagramNode} from "@nodes-node/diagram"
export type {NodesNodeDiagram} from "@nodes-node/diagram"
export {default as ParameterNode} from "@nodes-node/parameter"
export type {NodesNodeParameter} from "@nodes-node/parameter"
export {default as ContentNode} from "@nodes-node/content"
export type {NodesNodeContent} from "@nodes-node/content"
