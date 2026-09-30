/**
Цвет синтаксической области активной темы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ResolveSyntaxScopeColorHexInput} from "./contract/input"
import activeSyntaxTheme from "@ui-themes-syntax-theme/active"
import {foregroundFor} from "./src/helpers.ts"
import {normalizeHexColor} from "./src/helpers.ts"

export default function resolveSyntaxScopeColorHex(
  scopes: ResolveSyntaxScopeColorHexInput[0],
  fallback?: ResolveSyntaxScopeColorHexInput[1],
): string | undefined {
  const color = foregroundFor(activeSyntaxTheme, scopes)
    ?? fallback
    ?? activeSyntaxTheme.colors?.["editor.foreground"]
  const normalized = normalizeHexColor(color)
  return normalized === undefined ? undefined : `#${normalized}`
}

export type {ResolveSyntaxScopeColorHexInput} from "./contract/input"
