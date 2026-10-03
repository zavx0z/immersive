/** Непрерывный текстовый фрагмент с одинаковым оформлением. */
export type TerminalRun = Readonly<{
  text: string
  color?: string
  background?: string
  bold?: boolean
}>

/** Строка терминала сохраняет собственную identity при изменении отображения. */
export type TerminalLine = Readonly<{
  id: string
  runs: readonly TerminalRun[]
}>

/** Неизменяемые строки текущей ревизии вывода. */
export type TerminalSnapshot = Readonly<{
  revision: number
  lines: readonly TerminalLine[]
}>

/** Разрешённые служебные ответы: все поддержанные, только позиция курсора либо никакие. */
export type TerminalQueryMode = "all" | "cursor" | "none"
