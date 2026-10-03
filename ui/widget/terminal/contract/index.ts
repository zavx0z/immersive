import type {UiTerminalModel} from "@ui/terminal-model"
type TerminalLine = UiTerminalModel.Output["snapshot"]["lines"][number]
import type TerminalModel from "@ui/terminal-model"
import type {TerminalHandle} from "./types.ts"
import type {UiWidgetsHeader} from "@ui-widgets/header"
type WidgetHeaderProps = UiWidgetsHeader.Input

import type {JSX} from "@jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace UiWidgetsTerminal {
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

  type Output = JSX.Element
}
