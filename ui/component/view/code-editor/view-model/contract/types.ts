/**
Тип CodeEditorSegment принадлежит контракту своего владельца.
*/
export type CodeEditorSegment = Readonly<{
  key: string
  start: number
  end: number
  category: string
  text: string
  foreground: string
  background?: string | undefined
  inheritForeground?: true | undefined
}>
