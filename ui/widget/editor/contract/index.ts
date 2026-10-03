import type {CodeEditorProps} from "@ui-views/code-editor"
import type {WidgetHeaderProps} from "@ui-widgets/header"

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
