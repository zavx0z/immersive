import type {FunctionDeclaration, SourceFile} from "typescript/unstable/ast"
import {SyntaxKind} from "typescript/unstable/ast"
import {isBlock, isFunctionDeclaration, isImportDeclaration, isJsxElement, isJsxFragment, isJsxSelfClosingElement, isNamedImports, isReturnStatement, isStringLiteral, skipOuterExpressions} from "typescript/unstable/ast/is"

const authoringModules = new Set([
  "@zavx0z/immersive-component", "@zavx0z/immersive-component/authoring",
  "@zavx0z/immersive-component/slot", "@zavx0z/immersive-component/slot-presence",
  "@zavx0z/immersive-browser/authoring", "@zavx0z/immersive/XReact",
  "@zavx0z/immersive/XReact/browser", "@zavx0z/immersive/XReact/slot", "@zavx0z/immersive/XReact/slot-presence",
])

/** Одна классификация исходных деклараций для emit и генератора public types. */
export function getAuthoringDeclarations(source: SourceFile) {
  const functions = source.statements.filter((statement): statement is FunctionDeclaration => isFunctionDeclaration(statement) && statement.name !== undefined)
  return {
    components: functions.filter(declaration => /^[A-Z]/.test(declaration.name!.text) && componentReturn(declaration) !== null),
    hooks: functions.filter(declaration => /^use[A-Z0-9]/.test(declaration.name!.text)),
    authoringImports: source.statements.flatMap(statement => isImportDeclaration(statement) &&
      isStringLiteral(statement.moduleSpecifier) && authoringModules.has(statement.moduleSpecifier.text) &&
      statement.importClause?.phaseModifier !== SyntaxKind.TypeKeyword &&
      !(statement.importClause?.namedBindings && isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.every(binding => binding.isTypeOnly))
      ? [statement.moduleSpecifier.text] : []),
  }
}

export function componentReturn(declaration: FunctionDeclaration) {
  const body = declaration.body
  if (!body || !isBlock(body)) return null
  const returns = body.statements.filter(isReturnStatement)
  if (returns.length !== 1 || returns[0] !== body.statements.at(-1) || !returns[0]?.expression) return null
  const expression = skipOuterExpressions(returns[0].expression)
  return isJsxElement(expression) || isJsxSelfClosingElement(expression) || isJsxFragment(expression) ? returns[0] : null
}
