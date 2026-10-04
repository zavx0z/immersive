import type {ImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
type CodeEditorProps = ImmersiveUiComponentViewCodeEditor.Input


/** Проверка входных данных редактора исходного текста. */
export declare namespace ImmersiveUiComponentViewCodeEditorValidate {
  /** Аргументы публичной операции assertCodeEditorProps; порядок сохраняет её форму вызова. */
  type Input = readonly [
    props: CodeEditorProps
  ]

  /** Результат публичной операции. */
  type Output = void
}
