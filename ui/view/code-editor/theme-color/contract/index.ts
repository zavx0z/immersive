/** Возвращает нормализованный HEX-цвет темы редактора либо переданный запасной цвет. */
export declare namespace UiViewsCodeEditorThemeColor {
  /** Аргументы публичной операции themeColor; порядок сохраняет её форму вызова. */
  type Input = readonly [
    key: string,
    fallback: string
  ]

  /** Результат публичной операции. */
  type Output = string
}
