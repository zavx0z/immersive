/**
Подготовка строк, токенов и оформления редактора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiViewsCodeEditorViewModel as Contract} from "./contract"
import assertCodeEditorProps from "@ui-views-code-editor/validate"
import {buildViewModel} from "./src/helpers.ts"


export default function buildCodeEditorViewModel(props: Contract.Input[0]): Contract.Output {
  assertCodeEditorProps(props)
  return buildViewModel(props)
}

export type {UiViewsCodeEditorViewModel} from "./contract"
