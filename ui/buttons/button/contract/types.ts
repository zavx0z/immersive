

/**
Тип ButtonVariant принадлежит контракту своего владельца.
*/
export type ButtonVariant = "text" | "outlined" | "contained" | "glass"

/**
Тип ButtonTone принадлежит контракту своего владельца.
*/
export type ButtonTone = "neutral" | "primary" | "success" | "warning" | "error"

/**
Тип ButtonSize принадлежит контракту своего владельца.
*/
export type ButtonSize = "small" | "medium" | "large"

/**
Тип ButtonIconPosition принадлежит контракту своего владельца.
*/
export type ButtonIconPosition = "start" | "end"

/**
Тип ButtonPointerEvent принадлежит контракту своего владельца.
*/
export type ButtonPointerEvent = PointerEvent & Readonly<{
  currentTarget: HTMLButtonElement
}>

/**
Тип ButtonKeyboardEvent принадлежит контракту своего владельца.
*/
export type ButtonKeyboardEvent = KeyboardEvent & Readonly<{
  currentTarget: HTMLButtonElement
}>
