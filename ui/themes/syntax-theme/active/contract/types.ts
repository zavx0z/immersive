

/**
Тип SyntaxTokenColorRule принадлежит контракту своего владельца.
*/
export type SyntaxTokenColorRule = Readonly<{
  name?: string
  scope?: string | readonly string[]
  settings?: Readonly<{
    foreground?: string
    fontStyle?: string
  }>
}>

/**
Тип SyntaxColorTheme принадлежит контракту своего владельца.
*/
export type SyntaxColorTheme = Readonly<{
  name?: string
  type?: string
  colors?: Readonly<Record<string, string>>
  tokenColors?: readonly SyntaxTokenColorRule[]
}>
