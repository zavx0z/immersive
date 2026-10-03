export type RowInput = Readonly<{
  height?: number | undefined
  spacingBefore?: number | undefined
  socketIds?: readonly string[] | undefined
}>

export type Row = Readonly<{
  index: number
  top: number
  height: number
  centerY: number
  socketIds: readonly string[]
}>
