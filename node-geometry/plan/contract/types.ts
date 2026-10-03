export type NodeGeometryRowInput = Readonly<{
  height?: number | undefined
  spacingBefore?: number | undefined
  socketIds?: readonly string[] | undefined
}>

export type NodeGeometryRow = Readonly<{
  index: number
  top: number
  height: number
  centerY: number
  socketIds: readonly string[]
}>
