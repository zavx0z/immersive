import type {Zavx0zImmersiveUiComponentWidget} from "@zavx0z/immersive-ui-component-widget/contract"
import type {Zavx0zImmersiveTechTerminal} from "@zavx0z/immersive-tech-terminal"
type TerminalLine = Zavx0zImmersiveTechTerminal.Output["snapshot"]["lines"][number]
import type TerminalModel from "@zavx0z/immersive-tech-terminal"
import type {TerminalHandle} from "./types.ts"
import type {Zavx0zImmersiveUiComponentWidgetHeader} from "@zavx0z/immersive-ui-component-widget-header"
type WidgetHeaderProps = Zavx0zImmersiveUiComponentWidgetHeader.Input

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Вход компонента и его JSX-представление. */
export declare namespace Zavx0zImmersiveUiComponentWidgetTerminal {
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

  type Output = Zavx0zImmersiveUiComponentWidget.Output & JSX.Element
}
