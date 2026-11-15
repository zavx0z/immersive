import type {FunctionDeclaration, ReturnStatement} from "typescript/unstable/ast"

/** Условие прямого возврата JSX авторской функцией. */
export declare namespace ImmersiveJsxCompilerAuthoringReturn {
  /** Объявление функции из живого AST TypeScript. */
  type Input = readonly [declaration: FunctionDeclaration]
  /** Единственный завершающий JSX return либо null при другой форме тела. */
  type Output = ReturnStatement | null
}
