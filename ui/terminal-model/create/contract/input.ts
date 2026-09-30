import type {TerminalModelOptions} from "@ui/terminal-model"

/** Аргументы публичной операции createTerminalModel; порядок сохраняет её форму вызова. */
export type CreateTerminalModelInput = readonly [
  options?: TerminalModelOptions
]
