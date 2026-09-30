import type {TerminalQueryMode} from "./types.ts"

/**
Входные данные TerminalModelOptions.
*/
export interface TerminalModelOptions {
  readonly maxLines?: number
  readonly queryMode?: TerminalQueryMode
  readonly onReply?: (data: string) => void
}
