import type {SyntaxTokenColorRule} from "./types"

/** Активная цветовая тема и правила синтаксической подсветки. */
export declare namespace UiThemesSyntaxThemeActive {
  type Output = Readonly<{
    name?: string
    type?: string
    colors?: Readonly<Record<string, string>>
    tokenColors?: readonly SyntaxTokenColorRule[]
  }>
}
