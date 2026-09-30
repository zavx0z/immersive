

/**
Тип SyntaxRuntimeRule принадлежит контракту своего владельца.
*/
export type SyntaxRuntimeRule = Readonly<{
  scope: string | readonly string[]
  settings: Readonly<{foreground: string}>
}>

/**
Тип SyntaxRuntimeTheme принадлежит контракту своего владельца.
*/
export type SyntaxRuntimeTheme = Readonly<{
  colors: Readonly<Record<string, string>>
  tokenColors: readonly SyntaxRuntimeRule[]
}>
