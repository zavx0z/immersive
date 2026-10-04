import type {ImmersiveUiComponentBadge} from "@zavx0z/immersive-ui-component-badge"
import type {ImmersiveTechTextEditor} from "@zavx0z/immersive-tech-text-editor"
type CodeEditorRange = ImmersiveTechTextEditor.Output["snapshot"]["selections"][number]

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
  lineTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  markerTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  gutterTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  title?: string | undefined
}>
