import type {Zavx0zImmersiveUiSelectionValidateState} from "@zavx0z/immersive-ui-selection-validate-state"
type SelectionState = NonNullable<Zavx0zImmersiveUiSelectionValidateState.Input[0]>

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
