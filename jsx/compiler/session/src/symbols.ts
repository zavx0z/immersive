import {basename, resolve} from "node:path"
import {readFileSync} from "node:fs"
import {
  SymbolFlags,
  TypeFlags,
  SignatureKind,
  type Checker,
  type Project,
  type Symbol as TypeScriptSymbol,
  type Type,
} from "typescript/unstable/async"
import type {
  Expression,
  Identifier,
  Node,
  SourceFile,
  VariableDeclaration,
} from "typescript/unstable/ast"
import {NodeFlags} from "typescript/unstable/ast"
import {
  isBlock,
  isCallExpression,
  isFunctionDeclaration,
  isIdentifier,
  isImportDeclaration,
  isExpression,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxFragment,
  isJsxSelfClosingElement,
  isNamedImports,
  isParenthesizedExpression,
  isReturnStatement,
  isShorthandPropertyAssignment,
  isStringLiteral,
  isTaggedTemplateExpression,
  isTemplateExpression,
  isVariableDeclaration,
  isVariableDeclarationList,
} from "typescript/unstable/ast/is"
import {skipOuterExpressions, SyntaxKind} from "typescript/unstable/ast"
import JsxCompileError from "@zavx0z/immersive-jsx-compiler-error"
import SlotAuthoring, {slotNameForField} from "@zavx0z/immersive-jsx-slot-authoring"
import {GovernedFiles, sameRegularFile} from "./governed-paths.ts"
import type {
  JsxChildrenExpressionKind,
  JsxTransformSymbols
} from "./transform.ts"
import type {JsxStylePrimitiveKind} from "./style.ts"

const jsxElementMarker = "@zavx0z/immersive-jsx/element"
const cssCompilerIntrinsicMarker = "@zavx0z/immersive-template/css-compiler-intrinsic"
const declarationImports = new WeakMap<Project, Map<string, Promise<readonly string[]>>>()

/**
Разрешает идентификаторы компонентов, hooks и выражений JSX.

Бренд CSS проверяется только у тегов шаблонных строк. Обычные поля данных,
включая результаты generic selectors, не требуют раскрытия их типов ради CSS.
Для document выбирается только глобальное объявление из lib.dom; локальные
переменные, параметры и одноимённые свойства не становятся Document приложения.
*/
export async function buildJsxTransformSymbols(
  sourceFile: SourceFile,
  project: Project,
  governedFiles: GovernedFiles,
): Promise<JsxTransformSymbols> {
  const identifiers: Identifier[] = []
  visit(sourceFile, node => {
    if (isIdentifier(node)) identifiers.push(node)
  })
  const resolvedSymbols = await project.checker.getSymbolAtLocation(identifiers)
  const byNode = new Map<Node, number>()
  const objects = new Map<Node, TypeScriptSymbol>()
  for (let index = 0; index < identifiers.length; index += 1) {
    const identifier = identifiers[index]!
    const symbol = identifier.text === "document" && isShorthandPropertyAssignment(identifier.parent)
      ? await project.checker.getShorthandAssignmentValueSymbol(identifier.parent)
      : resolvedSymbols[index]
    if (!symbol) continue
    byNode.set(identifiers[index]!, symbol.id)
    objects.set(identifiers[index]!, symbol)
  }

  const importedComponents = new Set<number>()
  const componentSlots = new Map<number, readonly string[]>()
  const importedCustomHooks = new Set<number>()
  const documentSymbols = new Set<number>()
  for (const symbol of new Set(identifiers
    .filter(identifier => identifier.text === "document")
    .map(identifier => objects.get(identifier))
    .filter((symbol): symbol is TypeScriptSymbol => symbol !== undefined))) {
    for (const handle of symbol.declarations) {
      if (basename(handle.path) !== "lib.dom.d.ts") continue
      if ((await project.program.getSourceFileMetadata(handle.path))?.isDefaultLibrary !== true) continue
      const declaration = await handle.resolve(project)
      if (declaration && isVariableDeclaration(declaration) &&
        isIdentifier(declaration.name) && declaration.name.text === "document") {
        documentSymbols.add(symbol.id)
      }
    }
  }
  const dependencyPaths = new Set<string>()
  for (const path of await governedSemanticDependencyPaths(
    sourceFile,
    project,
    governedFiles,
  )) dependencyPaths.add(path)
  const cssIntrinsicSymbols = new Set<number>()
  const cssCandidates = new Set<TypeScriptSymbol>()
  visit(sourceFile, node => {
    if (!isTaggedTemplateExpression(node) || !isIdentifier(node.tag)) return
    const symbol = objects.get(node.tag)
    if (symbol) cssCandidates.add(symbol)
  })
  for (const symbol of cssCandidates) {
    if (await isBrandedCssCompilerIntrinsic(symbol, project)) {
      cssIntrinsicSymbols.add(symbol.id)
    }
  }
  const styleExpressions: Expression[] = []
  const dynamicChildren: Expression[] = []
  visit(sourceFile, node => {
    if (isJsxExpression(node) && node.expression) dynamicChildren.push(node.expression)
    if (isTaggedTemplateExpression(node) && isTemplateExpression(node.template)) {
      for (const span of node.template.templateSpans) styleExpressions.push(span.expression)
    }
    if (!isJsxAttribute(node) || node.name.getText(sourceFile) !== "style" ||
      !node.initializer || !isJsxExpression(node.initializer) || !node.initializer.expression) return
    visit(node.initializer.expression, child => {
      if (isExpression(child)) styleExpressions.push(child)
    })
  })
  const childTypes = await project.checker.getTypeAtLocation(dynamicChildren)
  const arrayExpressions = new Set<Node>()
  const childrenExpressionKinds = new Map<Node, JsxChildrenExpressionKind>()
  const classifiedTypes = new Map<number, Promise<JsxChildrenExpressionKind>>()
  for (let index = 0; index < dynamicChildren.length; index += 1) {
    const expression = skipParentheses(dynamicChildren[index]!)
    const type = childTypes[index]
    if (type && (
      await project.checker.isArrayType(type) || await project.checker.isTupleType(type)
    )) arrayExpressions.add(expression)
    if (!type) {
      childrenExpressionKinds.set(expression, "unsupported")
      continue
    }
    let classified = classifiedTypes.get(type.id)
    if (!classified) {
      classified = classifyChildrenExpressionType(type, project)
      classifiedTypes.set(type.id, classified)
    }
    childrenExpressionKinds.set(expression, await classified)
  }
  const styleTypes = await project.checker.getTypeAtLocation(styleExpressions)
  const stylePrimitiveKinds = new Map<Node, JsxStylePrimitiveKind>()
  for (let index = 0; index < styleExpressions.length; index += 1) {
    const expression = skipParentheses(styleExpressions[index]!)
    const type = styleTypes[index]
    stylePrimitiveKinds.set(
      expression,
      type ? await classifyStylePrimitiveType(type) : "unsupported",
    )
  }
  const jsxTagSymbols = new Set<number>()
  const callSymbols = new Set<number>()
  visit(sourceFile, node => {
    if (!isJsxElement(node) && !isJsxSelfClosingElement(node)) return
    const opening = isJsxElement(node) ? node.openingElement : node
    if (!isIdentifier(opening.tagName) || !/^[A-Z]/.test(opening.tagName.text)) return
    const id = byNode.get(opening.tagName)
    if (id !== undefined) jsxTagSymbols.add(id)
  })
  visit(sourceFile, node => {
    if (!isCallExpression(node) || !isIdentifier(node.expression)) return
    const id = byNode.get(node.expression)
    if (id !== undefined) callSymbols.add(id)
  })
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier)) continue
    const moduleName = statement.moduleSpecifier.text
    if (moduleName === "@zavx0z/immersive-component" || moduleName === "@zavx0z/immersive/XReact" || isReactRuntimeModule(moduleName)) continue
    const clause = statement.importClause
    if (!clause) continue
    const specifiers = [
      ...(clause.name ? [{name: clause.name, propertyName: undefined, isTypeOnly: false}] : []),
      ...(clause.namedBindings && isNamedImports(clause.namedBindings) ? clause.namedBindings.elements : []),
    ]
    for (const specifier of specifiers) {
      if ((moduleName === "@zavx0z/immersive-browser" || moduleName === "@zavx0z/immersive/XReact/browser") &&
        ["useSpace", "useFrame"].includes(specifier.propertyName?.text ?? specifier.name.text)) continue
      const componentCandidate = /^[A-Z]/.test(specifier.name.text)
      const hookCandidate = /^use[A-Z0-9]/.test(specifier.name.text)
      if (!componentCandidate && !hookCandidate) continue
      const alias = objects.get(specifier.name)
      if (!alias) {
        throw new JsxCompileError(`Cannot resolve imported component ${specifier.name.text}`, sourceFile.fileName)
      }
      const target = await project.checker.getAliasedSymbol(alias)
      const usedAsComponent = componentCandidate && (
        jsxTagSymbols.has(alias.id) || jsxTagSymbols.has(target.id)
      )
      const usedAsHook = hookCandidate && (callSymbols.has(alias.id) || callSymbols.has(target.id))
      if (!usedAsComponent && !usedAsHook) continue
      if (clause.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly) {
        throw new JsxCompileError(
          `Type-only import ${specifier.name.text} cannot be used at runtime`,
          sourceFile.fileName,
        )
      }
      if (usedAsComponent) {
        const valid = await hasGovernedComponentDeclaration(
          target,
          project,
          governedFiles,
          dependencyPaths,
          new Set(),
        )
        if (!valid) {
          throw new JsxCompileError(
            `Imported component ${specifier.name.text} does not resolve to a governed function component`,
            sourceFile.fileName,
          )
        }
        importedComponents.add(alias.id)
        importedComponents.add(target.id)
        const slots = await resolveComponentSlots(target, project, governedFiles, dependencyPaths, new Set())
        if (slots.length > 0) {
          componentSlots.set(alias.id, slots)
          componentSlots.set(target.id, slots)
        }
      }
      if (usedAsHook) {
        const valid = await hasGovernedCustomHookDeclaration(
          target,
          project,
          governedFiles,
          dependencyPaths,
        )
        if (!valid) {
          throw new JsxCompileError(
            `Imported hook ${specifier.name.text} does not resolve to a governed custom hook`,
            sourceFile.fileName,
          )
        }
        importedCustomHooks.add(alias.id)
        importedCustomHooks.add(target.id)
      }
    }
  }

  for (const statement of sourceFile.statements) {
    if (isFunctionDeclaration(statement) && statement.name) {
      const id = byNode.get(statement.name)
      const slots = new SlotAuthoring(sourceFile).outlets(statement)
      if (id !== undefined && slots.length > 0) componentSlots.set(id, slots)
    }
  }
  for (const dependencyPath of dependencyPaths) {
    if (sameRegularFile(dependencyPath, sourceFile.fileName)) {
      dependencyPaths.delete(dependencyPath)
    }
  }
  return Object.freeze({
    arrayExpressions,
    byNode,
    childrenExpressionKinds,
    componentSlots,
    cssIntrinsicSymbols,
    dependencyPaths,
    documentSymbols,
    importedComponents,
    importedCustomHooks,
    sourceIdentity: jsxSourceIdentity(sourceFile.fileName, governedFiles),
    stylePrimitiveKinds,
  })
}

/** Раскрывает слоты импортированного компонента и memo через исходник их владельца. */
async function resolveComponentSlots(
  symbol: TypeScriptSymbol,
  project: Project,
  files: GovernedFiles,
  dependencies: Set<string>,
  visited: Set<number>,
): Promise<readonly string[]> {
  const published = await publishedComponentType(symbol, project, dependencies)
  if (published !== null) {
    const runtimeSlots = await project.checker.getPropertyOfType(published, "slots")
    const runtimeType = runtimeSlots && await project.checker.getTypeOfSymbol(runtimeSlots)
    if (runtimeType) {
      const names = await literalSlotTuple(runtimeType, project)
      if (names !== null) return names
    }
    const signatures = await project.checker.getSignaturesOfType(published, SignatureKind.Call)
    const result = signatures[0] && await project.checker.getReturnTypeOfSignature(signatures[0])
    const marker = result && await project.checker.getPropertyOfType(result, "@zavx0z/immersive-jsx/slots")
    const slots = marker && await project.checker.getTypeOfSymbol(marker)
    if (!slots) return []
    const variants = slots.isUnionType() ? await slots.getTypes() : [slots]
    const names = new Set<string>()
    for (const type of variants) {
      if ((type.flags & (TypeFlags.Undefined | TypeFlags.Never)) !== 0) continue
      for (const property of await project.checker.getPropertiesOfType(type)) names.add(slotNameForField(property.name))
    }
    return [...names]
  }
  if (visited.has(symbol.id)) return []
  visited.add(symbol.id)
  for (const handle of symbol.declarations) {
    if (files.matchFile(handle.path) === null) continue
    dependencies.add(resolve(handle.path))
    const declaration = await handle.resolve(project)
    if (declaration && isFunctionDeclaration(declaration)) {
      return new SlotAuthoring(declaration.getSourceFile()).outlets(declaration)
    }
    if (!declaration || !isVariableDeclaration(declaration)) continue
    const value = declaration.initializer
    if (!value || !isCallExpression(value) || !isIdentifier(value.expression) ||
      !await isExactRuntimeMemo(value.expression, project) || !value.arguments[0] ||
      !isIdentifier(value.arguments[0])) continue
    const target = await project.checker.getSymbolAtLocation(value.arguments[0])
    if (!target) continue
    return resolveComponentSlots((target.flags & SymbolFlags.Alias) !== 0
      ? await project.checker.getAliasedSymbol(target) : target, project, files, dependencies, visited)
  }
  return []
}

/** Реальное поле ABI имеет приоритет над необязательным phantom-контрактом автора. */
async function literalSlotTuple(type: Type, project: Project): Promise<readonly string[] | null> {
  if (type.isUnionType() || type.isIntersectionType()) {
    for (const part of await type.getTypes()) {
      const names = await literalSlotTuple(part, project)
      if (names !== null) return names
    }
    return null
  }
  if (!await project.checker.isTupleType(type) || !type.isTypeReference()) return null
  const elements = await project.checker.getTypeArguments(type)
  if (!elements.every(element => element.isStringLiteralType())) return null
  return elements.map(element => (element as Type & {value: string}).value)
}

async function isBrandedCssCompilerIntrinsic(
  symbol: TypeScriptSymbol,
  project: Project,
): Promise<boolean> {
  const {checker} = project
  const type = await checker.getTypeOfSymbol(symbol)
  if (!type) return false
  const marker = await checker.getPropertyOfType(type, cssCompilerIntrinsicMarker)
  if (!marker) return false
  const markerType = await checker.getTypeOfSymbol(marker)
  if (markerType?.isBooleanLiteralType() !== true || markerType.value !== true) return false
  for (const declaration of symbol.declarations) {
    if (!/^css-global\.d\.ts$/.test(basename(declaration.path))) continue
    const metadata = await project.program.getSourceFileMetadata(declaration.path)
    const packageDirectory = metadata?.packageJsonDirectory
    if (!packageDirectory) continue
    try {
      const manifest = JSON.parse(readFileSync(resolve(packageDirectory, "package.json"), "utf8")) as {
        name?: unknown
      }
      if (manifest.name === "@zavx0z/immersive-template" || manifest.name === "@zavx0z/immersive") return true
    } catch {
      // An unreadable package identity cannot authorize the compiler intrinsic.
    }
  }
  return false
}

async function classifyStylePrimitiveType(type: Type): Promise<JsxStylePrimitiveKind> {
  if (type.isErrorType() || (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) {
    return "unsupported"
  }
  const parts = type.isUnionType() ? await type.getTypes() : [type]
  let kind: JsxStylePrimitiveKind | null = null
  for (const part of parts) {
    const next = (part.flags & (TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void)) !== 0
      ? "nullish"
      : (part.flags & TypeFlags.StringLike) !== 0
        ? "string"
        : (part.flags & TypeFlags.NumberLike) !== 0
          ? "number"
          : (part.flags & TypeFlags.BigIntLike) !== 0
            ? "bigint"
          : "unsupported"
    if (next === "unsupported" || (kind !== null && kind !== next)) return "unsupported"
    kind = next
  }
  return kind ?? "unsupported"
}

function jsxSourceIdentity(sourcePath: string, files: GovernedFiles): string {
  const owner = files.matchFile(sourcePath)
  if (!owner) return sourcePath.replaceAll("\\", "/")
  return `${owner.rootIndex}:${owner.relativePath.replaceAll("\\", "/")}`
}

async function classifyChildrenExpressionType(
  type: Type,
  project: Project,
): Promise<JsxChildrenExpressionKind> {
  const checker = project.checker
  if (type.isErrorType() || (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) {
    return "unsupported"
  }
  const parts = type.isUnionType() ? await type.getTypes() : [type]
  let component = false
  let compiled = false
  let keyed = false
  let nullable = false
  let text = false
  for (const part of parts) {
    if ((part.flags & (TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void)) !== 0) {
      nullable = true
      continue
    }
    if (isTextChildType(part)) {
      text = true
      continue
    }
    if (await checker.getPropertyOfType(part, "@zavx0z/immersive-component/value")) {
      if (!await isPreparedComponentType(part, project)) return "invalid-compiled-component"
      compiled = true
      continue
    }
    if (await isJsxElementType(part, checker)) {
      component = true
      continue
    }
    if (await isJsxElementArrayType(part, checker)) {
      keyed = true
      continue
    }
    return "unsupported"
  }
  const activeKinds = Number(component) + Number(keyed) + Number(text) + Number(compiled)
  if (!text && keyed) return "component-children"
  if (activeKinds === 0 && nullable) return "empty"
  if (compiled && !component && !keyed) return text ? "prepared-content" : "compiled-component"
  if (activeKinds !== 1) return "unsupported"
  if (keyed) return nullable ? "unsupported" : "keyed-components"
  if (component) return nullable ? "nullable-component" : "component"
  return "text"
}

/** Phantom-метка не заменяет обязательный nominal Symbol исходного ComponentValue. */
async function isPreparedComponentType(type: Type, project: Project): Promise<boolean> {
  return isNominalComponentType(type, project, "@zavx0z/immersive-component/value")
}

async function isNominalComponentType(type: Type, project: Project, markerName: string): Promise<boolean> {
  const marker = await project.checker.getPropertyOfType(type, markerName)
  if (!marker) return false
  const markerType = await project.checker.getTypeOfSymbol(marker)
  if (!markerType) return false
  const markerParts = markerType.isUnionType() ? await markerType.getTypes() : [markerType]
  if (!markerParts.some(part => part.isBooleanLiteralType() && part.value === true) ||
    markerParts.some(part => (part.flags & TypeFlags.Undefined) === 0 && !(part.isBooleanLiteralType() && part.value === true))) return false
  const paths = new Set<string>()
  for (const declaration of marker.declarations) {
    const metadata = await project.program.getSourceFileMetadata(declaration.path)
    const root = metadata?.packageJsonDirectory
    if (root === undefined) continue
    try {
      const name = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).name
      if (name === "@zavx0z/immersive-component" || name === "@zavx0z/immersive") paths.add(declaration.path)
    } catch { /* Нечитаемая package identity не подтверждает готовое значение. */ }
  }
  if (paths.size === 0) return false
  const brandName = markerName.endsWith("/compiled") ? "__@compiledComponentBrand@" : "__@componentValueBrand@"
  for (const property of await project.checker.getPropertiesOfType(type)) {
    if (!property.name.startsWith(brandName) || !property.declarations.some(declaration => paths.has(declaration.path))) continue
    const brand = await project.checker.getTypeOfSymbol(property)
    if (brand?.isBooleanLiteralType() === true && brand.value === true) return true
  }
  return false
}

function isTextChildType(type: Type): boolean {
  return (type.flags & (
    TypeFlags.StringLike |
    TypeFlags.NumberLike |
    TypeFlags.BigIntLike |
    TypeFlags.BooleanLike
  )) !== 0
}

async function isJsxElementType(type: Type, checker: Checker): Promise<boolean> {
  const marker = await checker.getPropertyOfType(type, jsxElementMarker)
  if (!marker) return false
  const markerType = await checker.getTypeOfSymbol(marker)
  return markerType?.isBooleanLiteralType() === true && markerType.value === true
}

async function isJsxElementArrayType(type: Type, checker: Checker): Promise<boolean> {
  const exactArray = await checker.isArrayType(type) || await checker.isTupleType(type)
  if (!exactArray && !await isReadonlyArrayType(type)) return false
  if (!type.isTypeReference()) return false
  const elementTypes = await checker.getTypeArguments(type)
  if (elementTypes.length === 0) return false
  for (const elementType of elementTypes) {
    if (!await isJsxElementType(elementType, checker)) return false
  }
  return true
}

async function isReadonlyArrayType(type: Type): Promise<boolean> {
  if (!type.isTypeReference()) return false
  const target = await type.getTarget()
  return (await target.getSymbol())?.name === "ReadonlyArray"
}

async function hasGovernedComponentDeclaration(
  symbol: TypeScriptSymbol,
  project: Project,
  governedFiles: GovernedFiles,
  dependencyPaths: Set<string>,
  visitedSymbols: Set<number>,
): Promise<boolean> {
  if (await publishedComponentType(symbol, project, dependencyPaths) !== null) return true
  if (visitedSymbols.has(symbol.id)) return false
  visitedSymbols.add(symbol.id)
  for (const handle of symbol.declarations) {
    if (governedFiles.matchFile(handle.path) === null) continue
    dependencyPaths.add(resolve(handle.path))
    const declaration = await handle.resolve(project)
    if (declaration && isSupportedFunctionComponent(declaration)) return true
    if (
      declaration && isVariableDeclaration(declaration) &&
      await isGovernedMemoComponent(
        declaration,
        project,
        governedFiles,
        dependencyPaths,
        visitedSymbols,
      )
    ) return true
  }
  return false
}

/** Готовый ABI подтверждается публичной .d.ts и номинальной меткой владельца. */
async function publishedComponentType(
  symbol: TypeScriptSymbol,
  project: Project,
  dependencies: Set<string>,
): Promise<Type | null> {
  if (symbol.declarations.length === 0 || symbol.declarations.some(handle => !/\.d\.[cm]?ts$/u.test(handle.path))) return null
  const type = await project.checker.getTypeOfSymbol(symbol)
  if (!type || !await isNominalComponentType(type, project, "@zavx0z/immersive-component/compiled")) return null
  const signatures = await project.checker.getSignaturesOfType(type, SignatureKind.Call)
  if (signatures.length !== 1) return null
  const result = await project.checker.getReturnTypeOfSignature(signatures[0]!)
  if (!result || !await isJsxElementType(result, project.checker)) return null
  const visited = new Set<string>()
  const pending = symbol.declarations.map(handle => resolve(handle.path))
  let imports = declarationImports.get(project)
  if (!imports) declarationImports.set(project, imports = new Map())
  while (pending.length > 0) {
    const path = pending.pop()!
    if (visited.has(path)) continue
    visited.add(path)
    dependencies.add(path)
    let referenced = imports.get(path)
    if (!referenced) {
      referenced = (async () => {
        const source = await project.program.getSourceFile(path)
        if (!source) return []
        const modules = await project.checker.getSymbolAtLocation(source.imports)
        return modules.flatMap(module => module?.declarations
          .filter(handle => /\.d\.[cm]?ts$/u.test(handle.path))
          .map(handle => resolve(handle.path)) ?? [])
      })()
      imports.set(path, referenced)
    }
    pending.push(...await referenced)
  }
  return type
}

async function isGovernedMemoComponent(
  declaration: VariableDeclaration,
  project: Project,
  governedFiles: GovernedFiles,
  dependencyPaths: Set<string>,
  visitedSymbols: Set<number>,
): Promise<boolean> {
  if (!isVariableDeclarationList(declaration.parent) ||
    (declaration.parent.flags & NodeFlags.Const) === 0) return false
  const initializer = declaration.initializer
  if (!initializer || !isCallExpression(initializer) || !isIdentifier(initializer.expression) ||
    initializer.arguments.length < 1 || initializer.arguments.length > 2 ||
    !isIdentifier(initializer.arguments[0]!)) return false
  if (!await isExactRuntimeMemo(initializer.expression, project)) return false
  const baseAlias = await project.checker.getSymbolAtLocation(initializer.arguments[0]!)
  if (!baseAlias) return false
  const base = (baseAlias.flags & SymbolFlags.Alias) !== 0
    ? await project.checker.getAliasedSymbol(baseAlias)
    : baseAlias
  return hasGovernedComponentDeclaration(
    base,
    project,
    governedFiles,
    dependencyPaths,
    visitedSymbols,
  )
}

async function isExactRuntimeMemo(identifier: Identifier, project: Project): Promise<boolean> {
  const sourceFile = identifier.getSourceFile()
  const identifierSymbol = await project.checker.getSymbolAtLocation(identifier)
  if (!identifierSymbol) return false
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier) ||
      (statement.moduleSpecifier.text !== "@zavx0z/immersive-component" &&
        statement.moduleSpecifier.text !== "@zavx0z/immersive/XReact")) continue
    const named = statement.importClause?.namedBindings
    if (!named || !isNamedImports(named)) continue
    for (const specifier of named.elements) {
      if ((specifier.propertyName?.text ?? specifier.name.text) !== "memo") continue
      if (statement.importClause?.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly) {
        continue
      }
      const importSymbol = await project.checker.getSymbolAtLocation(specifier.name)
      if (importSymbol?.id === identifierSymbol.id) return true
    }
  }
  return false
}

async function hasGovernedCustomHookDeclaration(
  symbol: TypeScriptSymbol,
  project: Project,
  governedFiles: GovernedFiles,
  dependencyPaths: Set<string>,
): Promise<boolean> {
  for (const handle of symbol.declarations) {
    if (governedFiles.matchFile(handle.path) === null) continue
    dependencyPaths.add(resolve(handle.path))
    const declaration = await handle.resolve(project)
    if (!declaration || !isFunctionDeclaration(declaration) || !declaration.name ||
      !/^use[A-Z0-9]/.test(declaration.name.text) || !declaration.body ||
      !isBlock(declaration.body) || declaration.asteriskToken) continue
    const modifiers = declaration.modifiers?.map(modifier =>
      modifier.getText(declaration.getSourceFile())) ?? []
    if (!modifiers.includes("async")) return true
  }
  return false
}

function isSupportedFunctionComponent(node: Node): boolean {
  if (!isFunctionDeclaration(node) || !node.name || !/^[A-Z]/.test(node.name.text)) return false
  if (!node.body || !isBlock(node.body) || node.asteriskToken || node.parameters.length > 1) return false
  if (node.typeParameters && node.typeParameters.length > 0) return false
  if (node.parameters[0]?.dotDotDotToken) return false
  const modifiers = node.modifiers?.map(modifier => modifier.getText(node.getSourceFile())) ?? []
  if (modifiers.includes("async")) return false
  const returns = node.body.statements.filter(isReturnStatement)
  if (returns.length !== 1 || returns[0] !== node.body.statements.at(-1) || !returns[0]!.expression) {
    return false
  }
  const expression = skipParentheses(returns[0]!.expression!)
  return isJsxElement(expression) || isJsxSelfClosingElement(expression) || isJsxFragment(expression)
}

function skipParentheses(expression: Expression): Expression {
  let current = expression
  while (isParenthesizedExpression(current)) current = current.expression
  return skipOuterExpressions(current)
}

function isReactRuntimeModule(moduleName: string): boolean {
  return moduleName === "react" || moduleName.startsWith("react/") ||
    moduleName === "react-dom" || moduleName.startsWith("react-dom/") ||
    moduleName === "react-reconciler" || moduleName.startsWith("react-reconciler/")
}

async function governedSemanticDependencyPaths(
  sourceFile: SourceFile,
  project: Project,
  governedFiles: GovernedFiles,
): Promise<ReadonlySet<string>> {
  const dependencies = new Set<string>()
  const visited = new Set<string>([resolve(sourceFile.fileName)])
  const queue: SourceFile[] = [sourceFile]
  while (queue.length > 0) {
    const current = queue.shift()!
    const moduleSymbols = await project.checker.getSymbolAtLocation(current.imports)
    for (const symbol of moduleSymbols) {
      if (!symbol) continue
      for (const declaration of symbol.declarations) {
        const match = governedFiles.matchFile(declaration.path)
        if (match === null) continue
        const dependencyPath = resolve(match.sourcePath)
        if (visited.has(dependencyPath) || sameRegularFile(dependencyPath, sourceFile.fileName)) {
          continue
        }
        visited.add(dependencyPath)
        dependencies.add(dependencyPath)
        const dependency = await project.program.getSourceFile(dependencyPath) ??
          await project.program.getSourceFile(declaration.path)
        if (dependency) queue.push(dependency)
      }
    }
  }
  return dependencies
}

function visit(node: Node, callback: (node: Node) => void): void {
  callback(node)
  node.forEachChild(child => {
    visit(child, callback)
    return undefined
  })
}
