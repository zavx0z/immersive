/**
Тип CycleFieldOption принадлежит контракту своего владельца.
*/
export type CycleFieldOption = Readonly<{
  key: string
  value: string
  label: string
  iconSrc?: string | undefined
  description?: string | undefined
  disabled?: boolean | undefined
  title?: string | undefined
}>

/**
Тип CycleFieldDensity принадлежит контракту своего владельца.
*/
export type CycleFieldDensity = "regular" | "compact"
