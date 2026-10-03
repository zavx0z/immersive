import type {JSX} from "@jsx-compiler/session"
import type {ToggleButtonGroupDensity} from "./types.ts"
import type {ToggleButtonGroupOption} from "./types.ts"

import type {UiButtons} from "@ui/buttons/contract"

/** Протокол выбора одного строкового значения из внешнего набора кнопок. */
export declare namespace UiButtonsToggleButtonGroup {
  /**
  Входные данные ToggleButtonGroup.
  */
  interface Input extends UiButtons.Input {
    readonly value: string
    readonly options: readonly ToggleButtonGroupOption[]
    readonly density?: ToggleButtonGroupDensity | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
  }

  /** Представление сохраняет общий JSX-результат группы. */
  type Output = UiButtons.Output & JSX.Element
}
