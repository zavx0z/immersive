/**
Выбор подсветки по языку и пути исходного текста.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ResolveCodeEditorHighlighterInput} from "./contract/input"
import {resolveLanguageHighlighter} from "@zavx0z/highlighter"

export default function resolveCodeEditorHighlighter(languageId?: ResolveCodeEditorHighlighterInput[0], path?: ResolveCodeEditorHighlighterInput[1]) {
  return resolveLanguageHighlighter({
    ...(languageId === undefined ? {} : {languageId}),
    ...(path === undefined ? {} : {path}),
    fallbackLanguageId: "plaintext"
  })
}

export type {ResolveCodeEditorHighlighterInput} from "./contract/input"
