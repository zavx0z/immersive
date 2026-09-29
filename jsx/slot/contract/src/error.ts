import JsxCompileError from "@jsx-compiler/error"
import type {Node} from "typescript/unstable/ast"

/**
Отказ статической проверки контракта с исходной позицией спорного назначения.

@property code - Причина отказа, пригодная для обработки без разбора текста.

@property line - Строка объявления или назначения, начиная с единицы.

@property column - Столбец того же исходника, начиная с единицы.
*/
export class SlotContractError extends JsxCompileError {
  readonly code: string
  readonly line: number
  readonly column: number

  /** Связывает отказ с AST snapshot вместо позиции сгенерированного кода. */
  constructor(code: string, message: string, node: Node) {
    const source = node.getSourceFile()
    const location = source.getLineAndCharacterOfPosition(node.getStart(source))
    super(`${code} ${location.line + 1}:${location.character + 1} ${message}`, source.fileName)
    this.code = code
    this.line = location.line + 1
    this.column = location.character + 1
  }
}
