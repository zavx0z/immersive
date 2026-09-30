/**
Проверка входных данных редактора исходного текста.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {AssertCodeEditorPropsInput} from "./contract/input"
import type {CodeEditorProps} from "@ui-views/code-editor"
import assertNonEmpty from "@ui-views-code-editor/assert-non-empty"
import CodeEditorModel from "@ui/code-editor-model"

export default function assertCodeEditorProps(props: AssertCodeEditorPropsInput[0]): void {
  if (typeof props !== "object" || props === null) throw new TypeError("CodeEditor props must be an object")
  if (typeof props.value !== "string") throw new TypeError("CodeEditor value must be a string")
  if (typeof props.readOnly !== "boolean") throw new TypeError("CodeEditor readOnly must be a boolean")
  if (props.softBreaks !== undefined && (!props.readOnly || !Array.isArray(props.softBreaks))) {
    throw new TypeError("CodeEditor softBreaks доступны только для чтения и передаются массивом смещений")
  }
  if (props.showFormattingCharacters !== undefined && typeof props.showFormattingCharacters !== "boolean") {
    throw new TypeError("CodeEditor showFormattingCharacters must be a boolean")
  }
  if (props.model !== undefined && !(props.model instanceof CodeEditorModel)) throw new TypeError("CodeEditor model must be a CodeEditorModel")
  if (props.onChange !== undefined && typeof props.onChange !== "function") throw new TypeError("CodeEditor onChange must be a function")
  if (props.ref !== undefined && typeof props.ref !== "function") throw new TypeError("CodeEditor ref must be a function")
  if (props.onLineNumberClick !== undefined && typeof props.onLineNumberClick !== "function") {
    throw new TypeError("CodeEditor onLineNumberClick must be a function")
  }
  if (props.languageId !== undefined) assertNonEmpty(props.languageId, "CodeEditor languageId")
  if (props.path !== undefined) assertNonEmpty(props.path, "CodeEditor path")
  if (props.showLineNumbers !== undefined && typeof props.showLineNumbers !== "boolean") {
    throw new TypeError("CodeEditor showLineNumbers must be a boolean")
  }
  if (props.title !== undefined && typeof props.title !== "string") throw new TypeError("CodeEditor title must be a string")
}

export type {AssertCodeEditorPropsInput} from "./contract/input"
