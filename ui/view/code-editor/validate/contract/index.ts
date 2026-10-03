import type {UiViewsCodeEditor} from "@ui-views/code-editor"
type CodeEditorProps = UiViewsCodeEditor.Input


/** Проверка входных данных редактора исходного текста. */
export declare namespace UiViewsCodeEditorValidate {
  /** Аргументы публичной операции assertCodeEditorProps; порядок сохраняет её форму вызова. */
  type Input = readonly [
    props: CodeEditorProps
  ]

  /** Результат публичной операции. */
  type Output = void
}
