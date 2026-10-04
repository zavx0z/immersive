/**
Возвращает нормализованный HEX-цвет темы редактора либо переданный запасной цвет.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiViewCodeEditorThemeColor as Contract} from "./contract"
import isHexColor from "@zavx0z/immersive-tech-color-hex-valid"
import normalizeHexColor from "@zavx0z/immersive-tech-color-hex-normalize"
import codeEditorSyntaxTheme from "@zavx0z/immersive-ui-component-view-code-editor-syntax-theme-data"

export default function themeColor(key: Contract.Input[0], fallback: Contract.Input[1]): Contract.Output {
  const value = codeEditorSyntaxTheme.colors[key]
  return value === undefined || !isHexColor(value) ? fallback : normalizeHexColor(value)
}

export type {Zavx0zImmersiveUiViewCodeEditorThemeColor} from "./contract"
