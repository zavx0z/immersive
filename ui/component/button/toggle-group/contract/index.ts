import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ToggleButtonGroupDensity} from "./types.ts"
import type {ToggleButtonGroupOption} from "./types.ts"

import type {Zavx0zImmersiveUiComponentButton} from "@zavx0z/immersive-ui-component-button/contract"

/** Протокол выбора одного строкового значения из внешнего набора кнопок. */
export declare namespace Zavx0zImmersiveUiComponentButtonToggleGroup {
  /**
  Входные данные ToggleButtonGroup.
  */
  interface Input extends Zavx0zImmersiveUiComponentButton.Input {
    readonly value: string
    readonly options: readonly ToggleButtonGroupOption[]
    readonly density?: ToggleButtonGroupDensity | undefined
    readonly readOnly?: boolean | undefined
    readonly onChange?: ((value: string, event: Event) => void) | undefined
  }

  /** Представление сохраняет общий JSX-результат группы. */
  type Output = Zavx0zImmersiveUiComponentButton.Output & JSX.Element
}
