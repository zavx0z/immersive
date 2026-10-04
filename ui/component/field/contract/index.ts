import type {ImmersiveUiComponent} from "@immersive-ui/component/contract"
import type {JSX} from "@immersive-jsx-compiler/session"

/** Поля предоставляют подпись, подсказку и оформление; конкретное значение определяет их собственный протокол. */
export declare namespace ImmersiveUiComponentField {
  interface Input {
    readonly label?: string | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** JSX-представление в Document приложения; точные Slots принадлежат конкретному полю. */
  type Output = ImmersiveUiComponent.Output
}
