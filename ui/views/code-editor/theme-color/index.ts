/**
Обработка theme-color.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ThemeColorInput} from "./contract/input"
import isHexColor from "@ui-views-code-editor/is-hex-color"
import normalizeHexColor from "@ui-views-code-editor/normalize-hex-color"
import codeEditorSyntaxTheme from "@ui-views-code-editor-syntax-theme/code-editor-syntax-theme"

export default function themeColor(key: ThemeColorInput[0], fallback: ThemeColorInput[1]): string {
  const value = codeEditorSyntaxTheme.colors[key]
  return value === undefined || !isHexColor(value) ? fallback : normalizeHexColor(value)
}

export type {ThemeColorInput} from "./contract/input"
