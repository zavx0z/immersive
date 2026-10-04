/**
Цвет синтаксической области редактора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentViewCodeEditorSyntaxThemeResolveScopeColorHex as Contract} from "./contract"
import codeEditorSyntaxTheme from "@zavx0z/immersive-ui-component-view-code-editor-syntax-theme-data"
import {foregroundFor} from "./src/helpers.ts"
import {normalizeHexColor} from "./src/helpers.ts"

export default function resolveCodeEditorSyntaxScopeColorHex(
  scopes: Contract.Input[0],
  fallback?: Contract.Input[1]
): Contract.Output {
  const color = foregroundFor(scopes)
    ?? fallback
    ?? codeEditorSyntaxTheme.colors["editor.foreground"]
  const normalized = normalizeHexColor(color)
  return normalized === undefined ? undefined : `#${normalized}`
}

export type {ImmersiveUiComponentViewCodeEditorSyntaxThemeResolveScopeColorHex} from "./contract"
