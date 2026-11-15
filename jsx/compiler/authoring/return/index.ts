/**
Единственный завершающий JSX return функции авторского компонента.
Результат сохраняет исходный AST для последующей трансляции и координат ошибок.

Исполняется сборщиком в Bun и использует AST/API TypeScript той же сессии.

@packageDocumentation
*/
import type {ImmersiveJsxCompilerAuthoringReturn as Contract} from "./contract"
export type {ImmersiveJsxCompilerAuthoringReturn} from "./contract"
import {isBlock, isReturnStatement, isJsxElement, isJsxSelfClosingElement, isJsxFragment, skipOuterExpressions} from "typescript/unstable/ast/is"

/** Возвращает исходный return, только если он единственный, последний и содержит JSX. */
export default function componentReturn(declaration: Contract.Input[0]): Contract.Output {
  const body = declaration.body
  if (!body || !isBlock(body)) return null
  const returns = body.statements.filter(isReturnStatement)
  if (returns.length !== 1 || returns[0] !== body.statements.at(-1) || !returns[0]?.expression) return null
  const expression = skipOuterExpressions(returns[0].expression)
  return isJsxElement(expression) || isJsxSelfClosingElement(expression) || isJsxFragment(expression) ? returns[0] : null
}
