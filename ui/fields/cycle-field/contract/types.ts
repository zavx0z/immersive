

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

/**
Тип CycleOptionProps принадлежит контракту своего владельца.
*/
export type CycleOptionProps = Readonly<{
  option: CycleFieldOption
  selected: boolean
  focusable: boolean
  disabled: boolean
  onSelect(key: string, event: PointerEvent): void
  onKeyDown(key: string, event: KeyboardEvent, source: HTMLButtonElement): void
}>
