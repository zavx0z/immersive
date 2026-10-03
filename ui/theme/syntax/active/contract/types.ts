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
