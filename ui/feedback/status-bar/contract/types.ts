

/**
Тип StatusBarItem принадлежит контракту своего владельца.
*/
export type StatusBarItem = Readonly<{
  id: string
  text: string
  highlighted?: boolean | undefined
}>

/**
Тип StatusBarItemViewProps принадлежит контракту своего владельца.
*/
export type StatusBarItemViewProps = Readonly<{
  item: StatusBarItem
  first: boolean
  separator: string
}>
