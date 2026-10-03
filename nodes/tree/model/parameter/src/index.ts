/**
Переходные связи модели графа с самостоятельными владельцами значений и Parameter Store.
Данные и реализация происходят из их публичных протоколов.

@packageDocumentation
*/
import type {NodeValuesOwn} from "@node-values/own"
import type {NodeValuesType} from "@node-values/type"
import type {NodesParameterStore} from "@nodes/parameter-store"
export {default as Parameter} from "@nodes/parameter-store"
export {default as ownNodeJsonValue} from "@node-values/own"
export {default as ownNodeValueType} from "@node-values/type"
export {default as equalNodeJsonValue} from "@node-values/equal"
export type NodeJsonValue = NodeValuesOwn.Input[0]
export type NodeJsonObject = Extract<NodeJsonValue, Readonly<{[key: string]: NodeJsonValue}>>
export type NodeValueType = NodeValuesType.Output
export type ParameterSnapshot<T extends NodeJsonValue = NodeJsonValue, TPresentation extends NodeJsonValue = NodeJsonValue> = ReturnType<NodesParameterStore.Output<T, TPresentation>["snapshot"]>
export type ParameterReference<T extends NodeJsonValue = NodeJsonValue, TPresentation extends NodeJsonValue = NodeJsonValue> = Pick<NodesParameterStore.Output<T, TPresentation>, "id" | "revision" | "value" | "presentation" | "valueType" | "snapshot" | "subscribe">
