import type {ImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
import type {CodeEditorSegment} from "./types"

/** Подготовленные строки и токены одного состояния редактора. */
export declare namespace ImmersiveUiComponentViewCodeEditorViewModel {
  type Input = readonly [props: ImmersiveUiComponentViewCodeEditor.Input]

  type Output = Readonly<{
    props: ImmersiveUiComponentViewCodeEditor.Input
    lines: readonly string[]
    lineEndings: readonly string[]
    segments: readonly (readonly CodeEditorSegment[])[]
    resolvedLanguageId: string
  }>
}
