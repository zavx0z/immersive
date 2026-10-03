import type {SyntaxRuntimeRule} from "./types"

/** Цвета редактора и упорядоченные правила подсветки синтаксических областей. */
export declare namespace UiViewsCodeEditorSyntaxThemeCodeEditorSyntaxTheme {
  type Output = Readonly<{
    colors: Readonly<Record<string, string>>
    tokenColors: readonly SyntaxRuntimeRule[]
  }>
}
