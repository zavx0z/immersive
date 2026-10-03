/** Действие шапки ноды; обработчик остаётся у вызывающего владельца. */
export type NodeAction = Readonly<{
  id: string
  label: string
  iconSrc: string
  selected?: boolean | undefined
  disabled?: boolean | undefined
  onClick?: ((event: Event) => void) | undefined
}>
