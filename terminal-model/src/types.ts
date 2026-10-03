/** Частное оформление ячейки декодируемого терминала. */
export type CellStyle = Readonly<{
  foreground: string | null
  background: string | null
  bold: boolean
}>

export type Cell = Readonly<{
  character: string
  style: CellStyle
}>
