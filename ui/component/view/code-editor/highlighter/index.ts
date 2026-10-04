/**
Выбор подсветки по языку и пути исходного текста.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentViewCodeEditorHighlighter as Contract} from "./contract"
import {resolveLanguageHighlighter} from "@zavx0z/highlighter"

export default function resolveCodeEditorHighlighter(languageId?: Contract.Input[0], path?: Contract.Input[1]): Contract.Output {
  return resolveLanguageHighlighter({
    ...(languageId === undefined ? {} : {languageId}),
    ...(path === undefined ? {} : {path}),
    fallbackLanguageId: "plaintext"
  })
}

export type {Zavx0zImmersiveUiComponentViewCodeEditorHighlighter} from "./contract"
