import type {NodeValuesOwn} from "@node-values/own"
type NodeJsonValue = NodeValuesOwn.Input[0]

/** Адресованное намерение изменить значение; запись в Store выполняет вызывающий владелец. */
export type ParameterInput = Readonly<{
  nodeId: string
  parameterId: string
  value: NodeJsonValue
}>
