import type {Zavx0zImmersiveUiComponentBadge} from "@zavx0z/immersive-ui-component-badge"
import type {Zavx0zImmersiveTechTextEditor} from "@zavx0z/immersive-tech-text-editor"
type CodeEditorRange = Zavx0zImmersiveTechTextEditor.Output["snapshot"]["selections"][number]

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
  lineTone?: Zavx0zImmersiveUiComponentBadge.Input["tone"] | undefined
  markerTone?: Zavx0zImmersiveUiComponentBadge.Input["tone"] | undefined
  gutterTone?: Zavx0zImmersiveUiComponentBadge.Input["tone"] | undefined
  title?: string | undefined
}>
