
/** CollectionItemShape описывает данные публичного контракта своего владельца. */
export type CollectionItemShape = Readonly<{
  id: string
  label: string
  disabled?: boolean | undefined
}>
