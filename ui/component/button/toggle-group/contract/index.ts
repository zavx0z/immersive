import type {JSX} from "@immersive-jsx-compiler/session"
import type {ToggleButtonGroupDensity} from "./types.ts"
import type {ToggleButtonGroupOption} from "./types.ts"

import type {ImmersiveUiComponentButton} from "@immersive-ui-component/button/contract"

/** Протокол выбора одного строкового значения из внешнего набора кнопок. */
export declare namespace ImmersiveUiComponentButtonToggleGroup {
  /**
  Входные данные ToggleButtonGroup.
  */
  interface Input extends ImmersiveUiComponentButton.Input {
    readonly value: string
    readonly options: readonly ToggleButtonGroupOption[]
    readonly density?: ToggleButtonGroupDensity | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
  }

  /** Представление сохраняет общий JSX-результат группы. */
  type Output = ImmersiveUiComponentButton.Output & JSX.Element
}
