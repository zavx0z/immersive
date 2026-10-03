/**
Возвращает нормализованный HEX-цвет темы редактора либо переданный запасной цвет.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiViewsCodeEditorThemeColor as Contract} from "./contract"
import isHexColor from "@ui-views-code-editor/is-hex-color"
import normalizeHexColor from "@ui-views-code-editor/normalize-hex-color"
import codeEditorSyntaxTheme from "@ui-views-code-editor-syntax-theme/code-editor-syntax-theme"

export default function themeColor(key: Contract.Input[0], fallback: Contract.Input[1]): Contract.Output {
  const value = codeEditorSyntaxTheme.colors[key]
  return value === undefined || !isHexColor(value) ? fallback : normalizeHexColor(value)
}

export type {UiViewsCodeEditorThemeColor} from "./contract"
