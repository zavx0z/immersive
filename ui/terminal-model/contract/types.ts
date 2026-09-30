

/**
Тип TerminalRun принадлежит контракту своего владельца.
*/
export type TerminalRun = Readonly<{text: string; color?: string; background?: string; bold?: boolean}>

/**
Тип TerminalLine принадлежит контракту своего владельца.
*/
export type TerminalLine = Readonly<{id: string; runs: readonly TerminalRun[]}>

/**
Тип TerminalSnapshot принадлежит контракту своего владельца.
*/
export type TerminalSnapshot = Readonly<{revision: number; lines: readonly TerminalLine[]}>

/**
Тип TerminalQueryMode принадлежит контракту своего владельца.
*/
export type TerminalQueryMode = "all" | "cursor" | "none"

/**
Тип CellStyle принадлежит контракту своего владельца.
*/
export type CellStyle = Readonly<{foreground: string | null; background: string | null; bold: boolean}>

/**
Тип Cell принадлежит контракту своего владельца.
*/
export type Cell = Readonly<{character: string; style: CellStyle}>
