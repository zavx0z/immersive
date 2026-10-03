/**
Тип SyntaxRuntimeRule принадлежит контракту своего владельца.
*/
export type SyntaxRuntimeRule = Readonly<{
  scope: string | readonly string[]
  settings: Readonly<{foreground: string}>
}>
