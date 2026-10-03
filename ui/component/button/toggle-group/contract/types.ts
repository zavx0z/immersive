

/**
Тип ToggleButtonGroupOption принадлежит контракту своего владельца.
*/
export type ToggleButtonGroupOption = Readonly<{
  key: string
  value: string
  label: string
  iconSrc?: string | undefined
  description?: string | undefined
  disabled?: boolean | undefined
  title?: string | undefined
}>

/**
Тип ToggleButtonGroupDensity принадлежит контракту своего владельца.
*/
export type ToggleButtonGroupDensity = "regular" | "compact"
