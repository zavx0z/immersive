/**
Подготовка строк, токенов и оформления редактора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {BuildCodeEditorViewModelInput} from "./contract/input"
import type {CodeEditorProps} from "@ui-views/code-editor"
import type {CodeEditorViewModel} from "./contract/types.ts"
import assertCodeEditorProps from "@ui-views-code-editor/validate"
import {buildViewModel} from "./src/helpers.ts"

export type {CodeEditorSegment, CodeEditorViewModel} from "./contract/types"

export default function buildCodeEditorViewModel(props: BuildCodeEditorViewModelInput[0]): CodeEditorViewModel {
  assertCodeEditorProps(props)
  return buildViewModel(props)
}

export type {BuildCodeEditorViewModelInput} from "./contract/input"
