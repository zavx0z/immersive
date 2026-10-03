import type {UiViewsCodeEditor} from "@ui-views/code-editor"
import type {CodeEditorSegment} from "./types"

/** Подготовленные строки и токены одного состояния редактора. */
export declare namespace UiViewsCodeEditorViewModel {
  type Input = readonly [props: UiViewsCodeEditor.Input]

  type Output = Readonly<{
    props: UiViewsCodeEditor.Input
    lines: readonly string[]
    lineEndings: readonly string[]
    segments: readonly (readonly CodeEditorSegment[])[]
    resolvedLanguageId: string
  }>
}
