import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {Zavx0zImmersiveNodesModelParameterValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
type NodeJsonValue = Zavx0zImmersiveTechJsonValueOwn.Input[0]
type NodeValueType = Zavx0zImmersiveNodesModelParameterValueType.Output

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
