import type {CodeEditorModelOptions} from "@ui/code-editor-model"

/** Аргументы публичной операции createCodeEditorModel; порядок сохраняет её форму вызова. */
export type CreateCodeEditorModelInput = readonly [
  options: CodeEditorModelOptions
]
