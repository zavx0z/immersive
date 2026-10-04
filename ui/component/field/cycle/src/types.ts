import type {ImmersiveUiComponentFieldCycle} from "../contract"

type CycleFieldOption = ImmersiveUiComponentFieldCycle.Input["options"][number]

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
