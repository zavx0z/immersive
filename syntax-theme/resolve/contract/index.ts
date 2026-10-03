/** Цвет синтаксической области с явно переданным запасным цветом. */
export declare namespace UiThemesSyntaxThemeResolve {
  /** Аргументы публичной операции resolveSyntaxScopeColorHex; порядок сохраняет её форму вызова. */
  type Input = readonly [
    scopes: readonly string[],
    fallback?: string
  ]

  type Output = string | undefined
}
