/**
Цвет синтаксической области активной темы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeSyntaxResolve as Contract} from "./contract"
import activeSyntaxTheme from "@immersive-ui-theme-syntax/active"
import {foregroundFor} from "./src/helpers.ts"
import {normalizeHexColor} from "./src/helpers.ts"

export default function resolveSyntaxScopeColorHex(
  scopes: Contract.Input[0],
  fallback?: Contract.Input[1],
): Contract.Output {
  const color = foregroundFor(activeSyntaxTheme, scopes)
    ?? fallback
    ?? activeSyntaxTheme.colors?.["editor.foreground"]
  const normalized = normalizeHexColor(color)
  return normalized === undefined ? undefined : `#${normalized}`
}

export type {ImmersiveUiThemeSyntaxResolve} from "./contract"
