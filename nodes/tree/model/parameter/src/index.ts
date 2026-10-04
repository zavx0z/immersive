/**
Переходные связи модели графа с самостоятельными владельцами значений и Parameter Store.
Данные и реализация происходят из их публичных протоколов.

@packageDocumentation
*/
import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {ImmersiveNodesModelParameterValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
import type {ImmersiveNodesModelParameterStore} from "@zavx0z/immersive-nodes-model-parameter-store"
export {default as Parameter} from "@zavx0z/immersive-nodes-model-parameter-store"
export {default as ownNodeJsonValue} from "@zavx0z/immersive-tech-json-value-own"
export {default as ownNodeValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
export {default as equalNodeJsonValue} from "@zavx0z/immersive-tech-json-value-equal"
export type NodeJsonValue = ImmersiveTechJsonValueOwn.Input[0]
export type NodeJsonObject = Extract<NodeJsonValue, Readonly<{[key: string]: NodeJsonValue}>>
export type NodeValueType = ImmersiveNodesModelParameterValueType.Output
export type ParameterSnapshot<T extends NodeJsonValue = NodeJsonValue, TPresentation extends NodeJsonValue = NodeJsonValue> = ReturnType<ImmersiveNodesModelParameterStore.Output<T, TPresentation>["snapshot"]>
export type ParameterReference<T extends NodeJsonValue = NodeJsonValue, TPresentation extends NodeJsonValue = NodeJsonValue> = Pick<ImmersiveNodesModelParameterStore.Output<T, TPresentation>, "id" | "revision" | "value" | "presentation" | "valueType" | "snapshot" | "subscribe">
