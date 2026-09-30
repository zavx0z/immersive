import type {CodeEditorProps} from "@ui-views/code-editor"
import type {WidgetHeaderProps} from "@ui-widgets/header"

/**
Входные данные Editor.
*/
export type EditorProps = CodeEditorProps & WidgetHeaderProps & Readonly<{
  onSave?: ((value: string, event: KeyboardEvent) => void) | undefined
  onSubmit?: ((value: string, event: KeyboardEvent) => void) | undefined
}>
