/**
Переходные связи модели графа с самостоятельными владельцами значений и Parameter Store.
Данные и реализация происходят из их публичных протоколов.

@packageDocumentation
*/
import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {Zavx0zImmersiveNodesModelParameterValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
import type {Zavx0zImmersiveNodesModelParameterStore} from "@zavx0z/immersive-nodes-model-parameter-store"
export {default as Parameter} from "@zavx0z/immersive-nodes-model-parameter-store"
export {default as ownNodeJsonValue} from "@zavx0z/immersive-tech-json-value-own"
export {default as ownNodeValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
export {default as equalNodeJsonValue} from "@zavx0z/immersive-tech-json-value-equal"
export type NodeJsonValue = Zavx0zImmersiveTechJsonValueOwn.Input[0]
export type NodeJsonObject = Extract<NodeJsonValue, Readonly<{[key: string]: NodeJsonValue}>>
export type NodeValueType = Zavx0zImmersiveNodesModelParameterValueType.Output
export type ParameterSnapshot<T extends NodeJsonValue = NodeJsonValue, TPresentation extends NodeJsonValue = NodeJsonValue> = ReturnType<Zavx0zImmersiveNodesModelParameterStore.Output<T, TPresentation>["snapshot"]>
export type ParameterReference<T extends NodeJsonValue = NodeJsonValue, TPresentation extends NodeJsonValue = NodeJsonValue> = Pick<Zavx0zImmersiveNodesModelParameterStore.Output<T, TPresentation>, "id" | "revision" | "value" | "presentation" | "valueType" | "snapshot" | "subscribe">
