import type {UiBadge} from "@ui/badge"
import type {UiCodeEditorModel} from "@ui/code-editor-model"
type CodeEditorRange = UiCodeEditorModel.Output["snapshot"]["selections"][number]

/** CodeEditorHandle описывает данные публичного контракта своего владельца. */
export type CodeEditorHandle = Readonly<{
  focus(): void
  isFocused(): boolean
  getSelection(): CodeEditorSelectionSet
  setSelections(selections: readonly CodeEditorRange[], primary?: number): void
  scrollToLine(line: number, options?: Readonly<{block?: "start" | "center" | "end" | "nearest"}>): void
}>

/** CodeEditorSelectionSet описывает данные публичного контракта своего владельца. */
export type CodeEditorSelectionSet = Readonly<{selections: readonly CodeEditorRange[]; primary: number}>

/** CodeEditorLineDecoration описывает данные публичного контракта своего владельца. */
export type CodeEditorLineDecoration = Readonly<{
  line: number
  lineTone?: UiBadge.Input["tone"] | undefined
  markerTone?: UiBadge.Input["tone"] | undefined
  gutterTone?: UiBadge.Input["tone"] | undefined
  title?: string | undefined
}>
