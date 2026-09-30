import type {CodeEditorRange} from "./types.ts"

/**
Входные данные CodeEditorModelOptions.
*/
export interface CodeEditorModelOptions {
  readonly value: string
  readonly readOnly?: boolean
  readonly selections?: readonly CodeEditorRange[]
  readonly primary?: number
  readonly historyLimit?: number
}
