import type {ImmersiveUiComponent} from "@immersive-ui/component/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Общий протокол кнопочных элементов: доступная подпись, запрет действия и JSX-представление. */
export declare namespace ImmersiveUiComponentButton {
  /** Общие свойства отдельного действия и группы выбора; участник может требовать подпись. */
  interface Input {
    readonly label?: string | undefined
    readonly disabled?: boolean | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Кнопка участвует в Document вызывающего Experience. */
  type Output = ImmersiveUiComponent.Output
}
