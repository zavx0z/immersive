/** Переносимая идентичность типа без локальных runtime-ссылок. */
export declare namespace ImmersiveNodesModelParameterValueType {
  type Input = readonly [value: Readonly<{id: string, version: number}>, label?: string]
  type Output = Input[0]
}
