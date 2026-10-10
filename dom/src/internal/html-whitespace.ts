import type {Node} from "../node.ts"
import type {Text} from "../text.ts"

/** HTML whitespace не включает NBSP и прочие значимые Unicode-пробелы. */
export const isHTMLWhitespace = (value: string): boolean => /^[\t\n\f\r ]*$/u.test(value)

/** Сохраняемый Text ребёнок, который не задаёт пространственного содержимого. */
export const isHTMLWhitespaceNode = (node: Node): node is Text => node.nodeType === 3 && isHTMLWhitespace(node.textContent ?? "")
