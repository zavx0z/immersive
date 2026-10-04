import type {ImmersiveUiComponentWidget} from "@immersive-ui-component/widget/contract"
import type {ImmersiveTechTerminal} from "@immersive-tech/terminal"
type TerminalLine = ImmersiveTechTerminal.Output["snapshot"]["lines"][number]
import type TerminalModel from "@immersive-tech/terminal"
import type {TerminalHandle} from "./types.ts"
import type {ImmersiveUiComponentWidgetHeader} from "@immersive-ui-component-widget/header"
type WidgetHeaderProps = ImmersiveUiComponentWidgetHeader.Input

import type {JSX} from "@immersive-jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentWidgetTerminal {
  /**
  Входные данные Terminal.
  */
  type Input = WidgetHeaderProps & Readonly<{
    model?: TerminalModel | undefined
    lines?: readonly TerminalLine[] | undefined
    input: string
    inputEnabled?: boolean | undefined
    showInput?: boolean | undefined
    inputMode?: "line" | "stream" | undefined
    followOutput?: boolean | undefined
    placeholder?: string | undefined
    onInput?: ((value: string, event: InputEvent) => void) | undefined
    onData?: ((data: string, source: "keyboard" | "paste") => void) | undefined
    onSubmit?: ((value: string, event: KeyboardEvent) => void) | undefined
    onKeyDown?: ((event: KeyboardEvent) => void) | undefined
    onFocusChange?: ((focused: boolean) => void) | undefined
    onReady?: ((handle: TerminalHandle | null) => void) | undefined
    style?: CssStyle | undefined
  }>

  type Output = ImmersiveUiComponentWidget.Output & JSX.Element
}
