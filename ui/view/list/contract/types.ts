/**
Тип ListItem принадлежит контракту своего владельца.
*/
export type ListItem = Readonly<{
  key: string
  label: string
  iconSrc?: string | undefined
  detail?: string | undefined
  disabled?: boolean | undefined
}>
