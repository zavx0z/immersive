/** Поддерживаемые ключевые слова CSS cursor; загрузка пользовательских URL-курсоров сюда не входит. */
export const CURSOR_KEYWORDS = [
  "auto", "default", "none", "context-menu", "help", "pointer", "progress", "wait",
  "cell", "crosshair", "text", "vertical-text", "alias", "copy", "move", "no-drop",
  "not-allowed", "grab", "grabbing", "all-scroll", "col-resize", "row-resize",
  "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize",
  "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize",
  "zoom-in", "zoom-out",
] as const

/** Вычисленное ключевое слово CSS cursor, переносимое в hit metadata. */
export type RenderCursor = typeof CURSOR_KEYWORDS[number]
const keywords = new Set<string>(CURSOR_KEYWORDS)

/** Невалидное статическое объявление не перекрывает предыдущее значение cascade. */
export function acceptsCursor(value: string): boolean {
  const token = value.trim().toLowerCase()
  return keywords.has(token) || token === "inherit" || token === "unset" || token === "initial" || token.includes("var(")
}

/** Cursor наследуется; initial даёт auto, невалидный результат var — наследуемое значение. */
export function computeCursor(value: string | undefined, inherited: RenderCursor = "auto"): RenderCursor {
  const token = value?.trim().toLowerCase()
  if (token === "initial") return "auto"
  return token !== undefined && keywords.has(token) ? token as RenderCursor : inherited
}
