import type {Zavx0zImmersiveUiComponent} from "@zavx0z/immersive-ui-component/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Поля предоставляют подпись, подсказку и оформление; конкретное значение определяет их собственный протокол. */
export declare namespace Zavx0zImmersiveUiComponentField {
  interface Input {
    readonly label?: string | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** JSX-представление в Document приложения; точные Slots принадлежат конкретному полю. */
  type Output = Zavx0zImmersiveUiComponent.Output
}
