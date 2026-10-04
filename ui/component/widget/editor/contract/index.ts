import type {Zavx0zImmersiveUiComponentWidget} from "@zavx0z/immersive-ui-component-widget/contract"
import type {Zavx0zImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
type CodeEditorProps = Zavx0zImmersiveUiComponentViewCodeEditor.Input
import type {Zavx0zImmersiveUiComponentWidgetHeader} from "@zavx0z/immersive-ui-component-widget-header"
type WidgetHeaderProps = Zavx0zImmersiveUiComponentWidgetHeader.Input

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace Zavx0zImmersiveUiComponentWidgetEditor {
  /**
  Входные данные Editor.
  */
  type Input = CodeEditorProps & WidgetHeaderProps & Readonly<{
    onSave?: ((value: string, event: KeyboardEvent) => void) | undefined
    onSubmit?: ((value: string, event: KeyboardEvent) => void) | undefined
  }>

  type Output = Zavx0zImmersiveUiComponentWidget.Output & JSX.Element
}
