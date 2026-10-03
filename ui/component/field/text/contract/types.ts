

/**
Тип TextFieldType принадлежит контракту своего владельца.
*/
export type TextFieldType = "text" | "search" | "password" | "email" | "url"

/**
Тип TextFieldInputEvent принадлежит контракту своего владельца.
*/
export type TextFieldInputEvent = InputEvent & Readonly<{
  currentTarget: HTMLInputElement
}>
