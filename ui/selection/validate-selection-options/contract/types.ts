

/**
Тип SelectionOptionShape принадлежит контракту своего владельца.
*/
export type SelectionOptionShape = Readonly<{
  key: string
  value: string
  label: string
  disabled?: boolean | undefined
}>

/**
Тип SelectionState принадлежит контракту своего владельца.
*/
export type SelectionState = "ready" | "undefined" | "error"
