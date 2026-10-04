import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
type NodeJsonValue = Zavx0zImmersiveTechJsonValueOwn.Input[0]

/** Адресованное намерение изменить значение; запись в Store выполняет вызывающий владелец. */
export type ParameterInput = Readonly<{
  nodeId: string
  parameterId: string
  value: NodeJsonValue
}>
