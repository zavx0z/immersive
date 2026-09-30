

/**
Тип MenuAction принадлежит контракту своего владельца.
*/
export type MenuAction = Readonly<{
  key: string
  label: string
  disabled?: boolean
  shortcut?: string
  onSelect(): void
}>
