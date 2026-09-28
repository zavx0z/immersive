import {SymbolFlags, type Symbol as NativeSymbol} from "typescript/unstable/async"
import {skipOuterExpressions, SyntaxKind, type Node} from "typescript/unstable/ast"
import {isCallExpression, isFunctionDeclaration, isIdentifier, isImportDeclaration, isNamedImports, isStringLiteral, isVariableDeclaration} from "typescript/unstable/ast/is"
import {SlotAuthoring} from "@jsx/authoring"
import {readSlotSchema} from "./schema.ts"
import type {Receiver, ValidationContext} from "./model.ts"

/** Следует native import/re-export aliases до исходного объявления. */
export async function resolveSymbol(symbol: NativeSymbol, context: ValidationContext): Promise<NativeSymbol> {
  let current = symbol
  const visited = new Set<number>()
  while (!visited.has(current.id)) {
    visited.add(current.id)
    for (const declaration of current.declarations) context.dependencyPaths.add(declaration.path)
    if ((current.flags & SymbolFlags.Alias) === 0) return current
    current = await context.project.checker.getImmediateAliasedSymbol(current) ??
      await context.project.checker.getAliasedSymbol(current)
  }
  return current
}

/** Создаёт identity независимо от структурного равенства сигнатур функций. */
export async function componentAtom(symbol: NativeSymbol, context: ValidationContext): Promise<string> {
  const resolved = await resolveSymbol(symbol, context)
  const atom = `component:${resolved.id}`
  context.identityNames.set(atom, resolved.name)
  const type = await context.project.checker.getTypeOfSymbol(resolved)
  if (type) context.identityTypes.set(atom, type.id)
  for (const declaration of resolved.declarations) context.dependencyPaths.add(declaration.path)
  return atom
}

/** Находит контракт исходного получателя, включая локальный alias и штатный memo. */
export async function receiverAt(node: Node, context: ValidationContext): Promise<Receiver | null> {
  const symbol = await context.project.checker.getSymbolAtLocation(node)
  return symbol ? resolveReceiver(symbol, context, new Set()) : null
}

/** Разрешает функцию один раз на проверку, не создавая отдельного реестра компонентов. */
async function resolveReceiver(
  sourceSymbol: NativeSymbol,
  context: ValidationContext,
  visited: Set<number>,
): Promise<Receiver | null> {
  const symbol = await resolveSymbol(sourceSymbol, context)
  if (visited.has(symbol.id)) return null
  const cached = context.receivers.get(symbol.id)
  if (cached) return cached
  visited.add(symbol.id)
  const pending = inspectReceiver(symbol, context, visited)
  context.receivers.set(symbol.id, pending)
  return pending
}

/** Читает реальные объявления и связывает схему только с явным return type. */
async function inspectReceiver(
  symbol: NativeSymbol,
  context: ValidationContext,
  visited: Set<number>,
): Promise<Receiver | null> {
  for (const handle of symbol.declarations) {
    context.dependencyPaths.add(handle.path)
    const declaration = await handle.resolve(context.project)
    if (declaration && isFunctionDeclaration(declaration) && declaration.body) {
      const source = declaration.getSourceFile()
      const outlets = new SlotAuthoring(source).outlets(declaration)
      const schema = await readSlotSchema(declaration, outlets, context)
      if (outlets.length > 0 && schema === null && !context.diagnostics.has(symbol.id)) {
        const location = source.getLineAndCharacterOfPosition(declaration.getStart(source))
        context.diagnostics.set(symbol.id, {
          code: "JSX-SLOTS-UNTYPED",
          component: symbol.name,
          file: source.fileName,
          line: location.line + 1,
          column: location.character + 1,
          message: `Компонент ${symbol.name} объявляет слоты без явного JSX.Element<Slots>; типы содержимого не ограничены`,
        })
      }
      return {symbol, declaration, source, outlets, schema}
    }
    if (!declaration || !isVariableDeclaration(declaration) || !declaration.initializer) continue
    const value = skipOuterExpressions(declaration.initializer)
    const target = isIdentifier(value)
      ? value
      : isCallExpression(value) && value.arguments[0] && await isRuntimeMemo(value.expression, context)
        ? value.arguments[0]
        : null
    if (!target) continue
    const targetSymbol = await context.project.checker.getSymbolAtLocation(target)
    if (targetSymbol) return resolveReceiver(targetSymbol, context, visited)
  }
  return null
}

/** Проверяет импорт штатного memo; одноимённый пользовательский вызов не получает его семантику. */
async function isRuntimeMemo(node: Node, context: ValidationContext): Promise<boolean> {
  if (!isIdentifier(node)) return false
  const symbol = await context.project.checker.getSymbolAtLocation(node)
  if (!symbol) return false
  for (const statement of node.getSourceFile().statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "@zavx0z/component") continue
    const clause = statement.importClause
    if (!clause || clause.phaseModifier === SyntaxKind.TypeKeyword ||
      !clause.namedBindings || !isNamedImports(clause.namedBindings)) continue
    for (const specifier of clause.namedBindings.elements) {
      if (specifier.isTypeOnly || (specifier.propertyName?.text ?? specifier.name.text) !== "memo") continue
      if ((await context.project.checker.getSymbolAtLocation(specifier.name))?.id === symbol.id) return true
    }
  }
  return false
}
