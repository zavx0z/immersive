/**
Тип StatusBarItem принадлежит контракту своего владельца.
*/
export type StatusBarItem = Readonly<{
  id: string
  text: string
  highlighted?: boolean | undefined
}>
