import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
type NodeJsonValue = ImmersiveTechJsonValueOwn.Input[0]

/** Адресованное намерение изменить значение; запись в Store выполняет вызывающий владелец. */
export type ParameterInput = Readonly<{
  nodeId: string
  parameterId: string
  value: NodeJsonValue
}>
