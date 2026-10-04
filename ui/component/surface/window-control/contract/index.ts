import type {ImmersiveUiComponentSurface} from "@zavx0z/immersive-ui-component-surface/contract"


import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace ImmersiveUiComponentSurfaceWindowControl {
  /**
  Управляющая кнопка окна. Может находиться в статус-баре, Tab или другой части того же Document.

  @property windowId - id связанной оболочки Window; отражается в aria-controls.
  @property label - Название окна на кнопке.
  @property open - То же состояние видимости, что передано Window; отражается в aria-expanded.
  @property onOpenChange - Переключает общее состояние; короткий клик открывает и закрывает окно.
  @property [disabled=false] - Отключает переключение.
  @property [style] - Оформление кнопки для принимающего контейнера.
  */
  interface Input {
    readonly windowId: string
    readonly label: string
    readonly open: boolean
    readonly onOpenChange: (open: boolean, event: Event) => void
    readonly disabled?: boolean | undefined
    readonly style?: CssStyle | undefined
  }

  type Output = ImmersiveUiComponentSurface.Output & JSX.Element
}
