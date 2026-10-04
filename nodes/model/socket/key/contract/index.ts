
/** Составляет однозначный адрес сокета из идентификаторов ноды и сокета. */
export declare namespace ImmersiveNodesModelSocketKey {
  type Input = readonly [nodeId: string, socketId: string]
  type Output = string
}
