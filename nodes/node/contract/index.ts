import type {JSX} from "@jsx-compiler/session"

/** Представления ноды сохраняют адрес, выбор, видимость и действия в Document графа. */
export declare namespace NodesNode {
  interface Input {
    readonly id: string
    readonly elementRef?: JSX.Ref<HTMLElement> | undefined
    readonly selected?: boolean | undefined
    readonly hidden?: boolean | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
    readonly onActivate?: ((event: Event) => void) | undefined
  }

  type Output = JSX.Element<object>
}
