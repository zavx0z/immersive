

/**
Тип PanelAction принадлежит контракту своего владельца.
*/
export type PanelAction = Readonly<{
  id: string
  label: string
  iconSrc: string
  title?: string | undefined
  disabled?: boolean | undefined
  selected?: boolean | undefined
  action?: ((event: Event) => void) | undefined
}>
