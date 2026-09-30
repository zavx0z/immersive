/**
Создание модели редактирования исходного текста.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {CreateCodeEditorModelInput} from "./contract/input"
import CodeEditorModel from "@ui/code-editor-model"
import type {CodeEditorModelOptions} from "@ui/code-editor-model"

export default function createCodeEditorModel(options: CreateCodeEditorModelInput[0]): CodeEditorModel {
  return new CodeEditorModel(options)
}

export type {CreateCodeEditorModelInput} from "./contract/input"
