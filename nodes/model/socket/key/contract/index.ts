
/** Составляет однозначный адрес сокета из идентификаторов ноды и сокета. */
export declare namespace SocketValuesKey {
  type Input = readonly [nodeId: string, socketId: string]
  type Output = string
}
