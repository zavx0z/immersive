import type {ListProps} from "./input.ts"

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

/**
Тип ListRowProps принадлежит контракту своего владельца.
*/
export type ListRowProps = Readonly<{
  item: ListItem
  selected: boolean
  disabled: boolean
  dense: boolean
  embedded: boolean
  onSelect?: ListProps["onSelect"]
}>
