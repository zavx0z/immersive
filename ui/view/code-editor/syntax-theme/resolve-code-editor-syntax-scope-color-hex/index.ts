/**
Цвет синтаксической области редактора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ResolveCodeEditorSyntaxScopeColorHexInput} from "./contract/input"
import codeEditorSyntaxTheme from "@ui-views-code-editor-syntax-theme/code-editor-syntax-theme"
import {foregroundFor} from "./src/helpers.ts"
import {normalizeHexColor} from "./src/helpers.ts"

export default function resolveCodeEditorSyntaxScopeColorHex(
  scopes: ResolveCodeEditorSyntaxScopeColorHexInput[0],
  fallback?: ResolveCodeEditorSyntaxScopeColorHexInput[1]
): string | undefined {
  const color = foregroundFor(scopes)
    ?? fallback
    ?? codeEditorSyntaxTheme.colors["editor.foreground"]
  const normalized = normalizeHexColor(color)
  return normalized === undefined ? undefined : `#${normalized}`
}

export type {ResolveCodeEditorSyntaxScopeColorHexInput} from "./contract/input"
