/**
Подготовка строк, токенов и оформления редактора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentViewCodeEditorViewModel as Contract} from "./contract"
import assertCodeEditorProps from "@zavx0z/immersive-ui-component-view-code-editor-validate"
import {buildViewModel} from "./src/helpers.ts"


export default function buildCodeEditorViewModel(props: Contract.Input[0]): Contract.Output {
  assertCodeEditorProps(props)
  return buildViewModel(props)
}

export type {Zavx0zImmersiveUiComponentViewCodeEditorViewModel} from "./contract"
