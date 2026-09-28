import type {SourceFile} from "typescript/unstable/ast"

/** Исходный AST TypeScript; проверка не исполняет авторский код. */
export type SlotAuthoringInput = SourceFile
