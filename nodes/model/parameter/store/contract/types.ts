import type {NodeValuesOwn} from "@node-values/own"
import type {NodeValuesType} from "@node-values/type"
type NodeJsonValue = NodeValuesOwn.Input[0]
type NodeValueType = NodeValuesType.Output

export type ParameterSnapshot<
  T extends NodeJsonValue = NodeJsonValue,
  TPresentation extends NodeJsonValue = NodeJsonValue,
> = Readonly<{
  id: string
  revision: number
  value: T
  presentation: TPresentation
  valueType?: NodeValueType
}>
