import type {Zavx0zImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
import type {CodeEditorSegment} from "./types"

/** Подготовленные строки и токены одного состояния редактора. */
export declare namespace Zavx0zImmersiveUiComponentViewCodeEditorViewModel {
  type Input = readonly [props: Zavx0zImmersiveUiComponentViewCodeEditor.Input]

  type Output = Readonly<{
    props: Zavx0zImmersiveUiComponentViewCodeEditor.Input
    lines: readonly string[]
    lineEndings: readonly string[]
    segments: readonly (readonly CodeEditorSegment[])[]
    resolvedLanguageId: string
  }>
}
