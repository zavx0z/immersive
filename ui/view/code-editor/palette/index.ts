/**
Палитра редактора и его поля номеров строк.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {editorBackground} from "./src/helpers.ts"
import {editorBorder} from "./src/helpers.ts"
import editorForeground from "@immersive-ui-view-code-editor/editor-foreground"
import {gutterBackground} from "./src/helpers.ts"
import {gutterForeground} from "./src/helpers.ts"

const codeEditorPalette = Object.freeze({
  editorBackground,
  editorForeground,
  gutterBackground,
  gutterForeground,
  editorBorder
})

export default codeEditorPalette
