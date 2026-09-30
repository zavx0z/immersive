import type {SelectionState} from "@ui-selection/validate-selection-options"

/**
Тип SelectFieldOption принадлежит контракту своего владельца.
*/
export type SelectFieldOption = Readonly<{
  key: string
  value: string
  label: string
  description?: string | undefined
  disabled?: boolean | undefined
  title?: string | undefined
}>

/**
Тип SelectFieldDensity принадлежит контракту своего владельца.
*/
export type SelectFieldDensity = "regular" | "compact"

/**
Тип SelectFieldState принадлежит контракту своего владельца.
*/
export type SelectFieldState = SelectionState
