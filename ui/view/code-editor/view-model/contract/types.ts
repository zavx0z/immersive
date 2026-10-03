import type {CodeEditorProps} from "@ui-views/code-editor"
import type {CodeEditorRange} from "@ui/code-editor-model"
import type {UiBadge} from "@ui/badge"

/**
Тип NormalizedToken принадлежит контракту своего владельца.
*/
export type NormalizedToken = Readonly<{
  s: number
  e: number
  c: string
  fg?: string | undefined
  bg?: string | undefined
}>

/**
Тип CodeEditorSegment принадлежит контракту своего владельца.
*/
export type CodeEditorSegment = Readonly<{
  key: string
  start: number
  end: number
  category: string
  text: string
  foreground: string
  background?: string | undefined
  inheritForeground?: true | undefined
}>

/**
Тип CodeEditorViewModel принадлежит контракту своего владельца.
*/
export type CodeEditorViewModel = Readonly<{
  props: CodeEditorProps
  lines: readonly string[]
  lineEndings: readonly string[]
  segments: readonly (readonly CodeEditorSegment[])[]
  resolvedLanguageId: string
}>
