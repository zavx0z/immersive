import type {Zavx0zUi} from "@zavx0z/ui/contract"
import type {JSX} from "@jsx-compiler/session"

/** Общий протокол кнопочных элементов: доступная подпись, запрет действия и JSX-представление. */
export declare namespace UiButtons {
  /** Общие свойства отдельного действия и группы выбора; участник может требовать подпись. */
  interface Input {
    readonly label?: string | undefined
    readonly disabled?: boolean | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  /** Кнопка участвует в Document вызывающего Experience. */
  type Output = Zavx0zUi.Output
}
