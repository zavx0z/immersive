import type {Expression, JsxElement, JsxFragment, JsxSelfClosingElement, Node, SourceFile} from "typescript/unstable/ast"
import {SyntaxKind, skipOuterExpressions} from "typescript/unstable/ast"
import {SymbolFlags, TypeFlags, type Project, type Symbol as NativeSymbol} from "typescript/unstable/async"
import {isArrayLiteralExpression, isBinaryExpression, isBindingElement, isCallExpression, isConditionalExpression, isElementAccessExpression, isFunctionDeclaration, isFunctionLikeDeclaration, isIdentifier, isJsxElement, isJsxFragment, isJsxSelfClosingElement, isObjectBindingPattern, isPropertyAccessExpression, isPropertyAssignment, isReturnStatement, isShorthandPropertyAssignment, isStringLiteral, isVariableDeclaration} from "typescript/unstable/ast/is"

export type JsxOrigin = JsxElement | JsxSelfClosingElement | JsxFragment

/** Native declarations сохраняют исходный JSX до стирания его конкретного типа. */
export async function readJsxOrigins(source: SourceFile, expression: Expression, project: Project): Promise<readonly JsxOrigin[] | null> {
  // Native handles используют канонический Path, отличный от fileName на macOS.
  const sourceSymbol = await project.checker.getSymbolAtLocation(source)
  const sourcePath = sourceSymbol?.declarations.find(handle => handle.kind === SyntaxKind.SourceFile)?.path ?? source.fileName
  const active = new Set<Node>()
  const combine = async (values: readonly Expression[]): Promise<readonly JsxOrigin[] | null> => {
    const origins: JsxOrigin[] = []
    for (const value of values) { const part = await resolve(value); if (part === null) return null; origins.push(...part) }
    return [...new Set(origins)]
  }
  const symbolOrigins = async (symbol: NativeSymbol | undefined): Promise<readonly JsxOrigin[] | null> => {
    if (!symbol) return null
    if ((symbol.flags & SymbolFlags.Alias) !== 0) symbol = await project.checker.getAliasedSymbol(symbol)
    const values: Expression[] = []
    for (const handle of symbol.declarations) {
      // Декларация готового компонента не разрешает читать чужой authored JSX.
      if (handle.path !== sourcePath) return null
      const declaration = await handle.resolve(project)
      if (!declaration) return null
      if ((isVariableDeclaration(declaration) || isPropertyAssignment(declaration)) && declaration.initializer) values.push(declaration.initializer)
      else if (isShorthandPropertyAssignment(declaration)) {
        const result = await symbolOrigins(await project.checker.getShorthandAssignmentValueSymbol(declaration))
        if (result === null) return null
        values.push(...result)
      }
      else if (isBindingElement(declaration)) {
        if (declaration.initializer) values.push(declaration.initializer)
        const pattern = declaration.parent
        if (!isObjectBindingPattern(pattern)) return null
        const property = declaration.propertyName ?? declaration.name
        if (!property || !isIdentifier(property) && !isStringLiteral(property)) return null
        const type = await project.checker.getTypeAtLocation(isVariableDeclaration(pattern.parent) && pattern.parent.initializer ? pattern.parent.initializer : pattern.parent)
        const result = await symbolOrigins(type ? await project.checker.getPropertyOfType(type, property.text) : undefined)
        if (result === null) return null
        values.push(...result)
      } else if (isFunctionDeclaration(declaration) && declaration.body) {
        const returns: Expression[] = []
        const visit = (node: Node) => {
          if (isFunctionLikeDeclaration(node)) return
          if (isReturnStatement(node) && node.expression) returns.push(node.expression)
          node.forEachChild(visit)
        }
        visit(declaration.body)
        values.push(...returns)
      } else return null
    }
    // Initializer не доказывает значение после отдельной записи в тот же symbol.
    for (const handle of await project.checker.getReferencesToSymbolInFile(source.fileName, symbol)) {
      if (handle.path !== sourcePath) continue
      let reference = await handle.resolve(project)
      if (!reference) continue
      if (isPropertyAccessExpression(reference.parent) && reference.parent.name === reference) reference = reference.parent
      const parent = reference.parent
      if (isBinaryExpression(parent) && parent.left === reference && parent.operatorToken.kind >= SyntaxKind.FirstAssignment && parent.operatorToken.kind <= SyntaxKind.LastAssignment) return null
    }
    return values.length ? combine(values) : null
  }
  const resolve = async (original: Expression): Promise<readonly JsxOrigin[] | null> => {
    const value = skipOuterExpressions(original)
    if (isJsxElement(value) || isJsxSelfClosingElement(value) || isJsxFragment(value)) return [value]
    if (active.has(value)) return null
    active.add(value)
    try {
      if (value.kind === SyntaxKind.NullKeyword || value.kind === SyntaxKind.TrueKeyword || value.kind === SyntaxKind.FalseKeyword) return []
      if (isConditionalExpression(value)) return await combine([value.whenTrue, value.whenFalse])
      if (isArrayLiteralExpression(value)) return await combine([...value.elements] as Expression[])
      const location = isPropertyAccessExpression(value) ? value.name : isCallExpression(value) ? value.expression : value
      let symbol = await project.checker.getSymbolAtLocation(location)
      if (!symbol && isElementAccessExpression(value) && isStringLiteral(value.argumentExpression)) {
        const type = await project.checker.getTypeAtLocation(value.expression)
        if (type) symbol = await project.checker.getPropertyOfType(type, value.argumentExpression.text)
      }
      if (symbol) {
        const origins = await symbolOrigins(symbol)
        if (origins !== null) return origins
      }
      const type = await project.checker.getTypeAtLocation(value)
      return type && (type.flags & (TypeFlags.Undefined | TypeFlags.Null | TypeFlags.Never | TypeFlags.BooleanLike)) !== 0 ? [] : null
    } finally { active.delete(value) }
  }
  return resolve(expression)
}
