import type {BadgeTone} from "@ui/badge"
import type {CodeEditorRange} from "@ui/code-editor-model"

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
  lineTone?: BadgeTone | undefined
  markerTone?: BadgeTone | undefined
  gutterTone?: BadgeTone | undefined
  title?: string | undefined
}>
