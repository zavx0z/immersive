

import type {resolveLanguageHighlighter} from "@zavx0z/highlighter"

/** Выбор подсветки по языку и пути исходного текста. */
export declare namespace UiViewsCodeEditorHighlighter {
  /** Аргументы публичной операции resolveCodeEditorHighlighter; порядок сохраняет её форму вызова. */
  type Input = readonly [
    languageId?: string,
    path?: string
  ]

  /** Результат публичной операции. */
  type Output = ReturnType<typeof resolveLanguageHighlighter>
}
