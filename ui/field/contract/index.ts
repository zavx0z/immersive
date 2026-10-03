import type {Zavx0zUi} from "@zavx0z/ui/contract"
import type {JSX} from "@jsx-compiler/session"

/** Поля предоставляют подпись, подсказку и оформление; конкретное значение определяет их собственный протокол. */
export declare namespace UiFields {
  interface Input {
    readonly label?: string | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** JSX-представление в Document приложения; точные Slots принадлежат конкретному полю. */
  type Output = Zavx0zUi.Output
}
