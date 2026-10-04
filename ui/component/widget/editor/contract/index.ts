import type {ImmersiveUiComponentWidget} from "@immersive-ui-component/widget/contract"
import type {ImmersiveUiComponentViewCodeEditor} from "@immersive-ui-component-view/code-editor"
type CodeEditorProps = ImmersiveUiComponentViewCodeEditor.Input
import type {ImmersiveUiComponentWidgetHeader} from "@immersive-ui-component-widget/header"
type WidgetHeaderProps = ImmersiveUiComponentWidgetHeader.Input

import type {JSX} from "@immersive-jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace ImmersiveUiComponentWidgetEditor {
  /**
  Входные данные Editor.
  */
  type Input = CodeEditorProps & WidgetHeaderProps & Readonly<{
    onSave?: ((value: string, event: KeyboardEvent) => void) | undefined
    onSubmit?: ((value: string, event: KeyboardEvent) => void) | undefined
  }>

  type Output = ImmersiveUiComponentWidget.Output & JSX.Element
}
