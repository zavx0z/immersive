import type {UiViewsCodeEditor} from "@ui-views/code-editor"
type CodeEditorProps = UiViewsCodeEditor.Input
import type {UiWidgetsHeader} from "@ui-widgets/header"
type WidgetHeaderProps = UiWidgetsHeader.Input

import type {JSX} from "@jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace UiWidgetsEditor {
  /**
  Входные данные Editor.
  */
  type Input = CodeEditorProps & WidgetHeaderProps & Readonly<{
    onSave?: ((value: string, event: KeyboardEvent) => void) | undefined
    onSubmit?: ((value: string, event: KeyboardEvent) => void) | undefined
  }>

  type Output = JSX.Element
}
