import type {TerminalHandle} from "./types.ts"
import type {WidgetHeaderProps} from "@ui-widgets/header"
import type {TerminalLine} from "@ui/terminal-model"
import type TerminalModel from "@ui/terminal-model"

/**
Входные данные Terminal.
*/
export type TerminalProps = WidgetHeaderProps & Readonly<{
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
