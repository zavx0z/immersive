

/**
Тип TerminalTextPosition принадлежит контракту своего владельца.
*/
export type TerminalTextPosition = Readonly<{line: number; col: number}>

/**
Тип TerminalSelectionSnapshot принадлежит контракту своего владельца.
*/
export type TerminalSelectionSnapshot = Readonly<{
  anchor: TerminalTextPosition
  focus: TerminalTextPosition
  start: TerminalTextPosition
  end: TerminalTextPosition
  text: string
}>

/**
Тип TerminalHandle принадлежит контракту своего владельца.
*/
export type TerminalHandle = Readonly<{
  focus(): void
  isFocused(): boolean
  getSelection(): TerminalSelectionSnapshot | null
  getOutputScrollPosition(): Readonly<{left: number; top: number}>
}>
