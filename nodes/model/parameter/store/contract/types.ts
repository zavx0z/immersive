import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {ImmersiveNodesModelParameterValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
type NodeJsonValue = ImmersiveTechJsonValueOwn.Input[0]
type NodeValueType = ImmersiveNodesModelParameterValueType.Output

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
