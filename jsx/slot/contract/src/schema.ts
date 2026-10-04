import {SymbolFlags, TypeFlags, type Type} from "typescript/unstable/async"
import type {FunctionDeclaration, Node, TypeNode} from "typescript/unstable/ast"
import {isExpressionWithTypeArguments, isInterfaceDeclaration, isTypeAliasDeclaration, isTypeQueryNode, isTypeReferenceNode} from "typescript/unstable/ast/is"
import {SlotContractError} from "./error.ts"
import {componentAtom, resolveSymbol} from "./symbols.ts"
import type {SlotField, ValidationContext} from "./model.ts"

const emptyTypeFlags = TypeFlags.Undefined | TypeFlags.Null | TypeFlags.Void | TypeFlags.Never

/** Извлекает phantom-схему из разрешённой return annotation, не из имени файла контракта. */
export async function readSlotSchema(
  declaration: FunctionDeclaration,
  outlets: readonly string[],
  context: ValidationContext,
): Promise<ReadonlyMap<string, SlotField> | null> {
  if (!declaration.type) return null
  const {checker} = context.project
  const result = await checker.getTypeFromTypeNode(declaration.type)
  if (!result || !await isElementType(result, context)) return null
  const marker = await checker.getPropertyOfType(result, "@immersive/jsx/slots")
  if (!marker) return null
  const markerType = await checker.getTypeOfSymbol(marker)
  if (!markerType) return null
  const schemas = (markerType.isUnionType() ? await markerType.getTypes() : [markerType])
    .filter(type => (type.flags & emptyTypeFlags) === 0)
  if (schemas.length === 0) return null
  if (schemas.length !== 1 || !schemas[0]!.isObjectType() || schemas[0]!.isErrorType()) {
    throw new SlotContractError("JSX-SLOTS-CONTRACT", "Схема слотов должна разрешаться в один объект полей", declaration.type)
  }
  const schema = schemas[0]!
  await typeQueryAtoms(declaration.type, context, new Set())
  await rememberType(schema, context)
  if ((await checker.getIndexInfosOfType(schema)).length > 0) {
    throw new SlotContractError("JSX-SLOTS-CONTRACT", "Имена слотов задаются явными полями; index signature не задаёт точки вставки", declaration.type)
  }
  const fields = new Map<string, SlotField>()
  for (const property of await checker.getPropertiesOfType(schema)) {
    const name = property.name === "default" ? "" : property.name
    if (fields.has(name)) {
      throw new SlotContractError("JSX-SLOTS-NAME", "Поля default и пустое строковое имя обозначают одну область и не могут задаваться вместе", declaration.type)
    }
    const type = await checker.getTypeOfSymbol(property)
    if (!type) throw new SlotContractError("JSX-SLOTS-CONTRACT", `Не удалось разрешить тип слота ${property.name}`, declaration.type)
    const queries: TypeNode[] = []
    for (const handle of property.declarations) {
      context.dependencyPaths.add(handle.path)
      const node = await handle.resolve(context.project)
      if (node && "type" in node && node.type) queries.push(node.type as TypeNode)
    }
    const identities = new Set<string>()
    for (const node of queries) {
      for (const atom of await typeQueryAtoms(node, context, new Set())) identities.add(atom)
    }
    const shape = await fieldShape(type, identities, declaration.type, context)
    fields.set(name, {
      name,
      optional: (property.flags & SymbolFlags.Optional) !== 0,
      array: shape.array,
      atoms: shape.atoms,
    })
  }
  const outletSet = new Set(outlets)
  for (const name of fields.keys()) {
    if (!outletSet.has(name)) {
      throw new SlotContractError("JSX-SLOTS-NAME", `Поле ${name || "default"} не имеет соответствующего <slot>`, declaration.type)
    }
  }
  for (const name of outlets) {
    if (!fields.has(name)) {
      throw new SlotContractError("JSX-SLOTS-NAME", `Точка вставки ${name || "default"} отсутствует в явной схеме`, declaration.type)
    }
  }
  return fields
}

/** Проверяет действующий бренд авторского JSX через checker, включая импортированные aliases. */
export async function isElementType(type: Type, context: ValidationContext): Promise<boolean> {
  const property = await context.project.checker.getPropertyOfType(type, "@immersive/jsx/element")
  if (!property) return false
  const marker = await context.project.checker.getTypeOfSymbol(property)
  return marker?.isBooleanLiteralType() === true && marker.value === true
}

/** Добавляет исходники реальных символов типа в semantic dependency set. */
async function rememberType(type: Type, context: ValidationContext): Promise<void> {
  for (const symbol of [await type.getAliasSymbol(), await type.getSymbol()]) {
    for (const declaration of symbol?.declarations ?? []) context.dependencyPaths.add(declaration.path)
  }
}

/**
Раскрывает native тип поля; массив определяет допустимость нескольких назначений.
Function type принимается только при наличии identity из typeof, а не по форме сигнатуры.
*/
async function fieldShape(
  type: Type,
  identities: ReadonlySet<string>,
  location: Node,
  context: ValidationContext,
): Promise<Readonly<{array: boolean, atoms: ReadonlySet<string>}>> {
  if (type.isErrorType() || (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) {
    throw new SlotContractError("JSX-SLOTS-CONTRACT", "Тип содержимого слота не может быть any, unknown или неразрешённым типом", location)
  }
  const atoms = new Set<string>()
  let array = false
  for (const part of type.isUnionType() ? await type.getTypes() : [type]) {
    if ((part.flags & emptyTypeFlags) !== 0) continue
    await rememberType(part, context)
    if ((part.flags & (TypeFlags.StringLike | TypeFlags.NumberLike | TypeFlags.BigIntLike)) !== 0 &&
      (part.flags & (TypeFlags.String | TypeFlags.Number | TypeFlags.BigInt)) === 0) {
      throw new SlotContractError("JSX-SLOTS-CONTRACT", "Суженные literal и template primitive types не поддерживаются; используйте явный string, number или bigint", location)
    }
    if (part.isTypeReference() && (
      await context.project.checker.isArrayType(part) ||
      (await (await part.getTarget()).getSymbol())?.name === "ReadonlyArray"
    )) {
      array = true
      const arguments_ = await context.project.checker.getTypeArguments(part)
      if (arguments_.length !== 1) throw new SlotContractError("JSX-SLOTS-CONTRACT", "Массив слота требует один тип содержимого", location)
      const child = await fieldShape(arguments_[0]!, identities, location, context)
      if (child.array) throw new SlotContractError("JSX-SLOTS-CONTRACT", "Контракт области задаёт одну коллекцию, без вложенного типа массива", location)
      for (const atom of child.atoms) atoms.add(atom)
      continue
    }
    if (await isElementType(part, context)) atoms.add("element")
    else if ((part.flags & TypeFlags.String) !== 0) atoms.add("string")
    else if ((part.flags & TypeFlags.Number) !== 0) atoms.add("number")
    else if ((part.flags & TypeFlags.BigInt) !== 0) atoms.add("bigint")
    else if ((await context.project.checker.getSignaturesOfType(part, 0)).length > 0 &&
      [...identities].some(atom => context.identityTypes.get(atom) === part.id)) {
      for (const atom of identities) {
        if (context.identityTypes.get(atom) === part.id) atoms.add(atom)
      }
    } else {
      throw new SlotContractError("JSX-SLOTS-CONTRACT", "Поле слота требует typeof компонента, JSX.Element, primitive text или readonly массив этих типов", location)
    }
  }
  if (atoms.size === 0) throw new SlotContractError("JSX-SLOTS-CONTRACT", "Тип слота не содержит допустимого непустого значения", location)
  return {array, atoms}
}

/**
Сохраняет объявления typeof даже у memo, чей native function type структурно обобщён.
Type aliases раскрываются нативными symbol handles; авторский текст не парсится повторно.
*/
async function typeQueryAtoms(
  node: Node,
  context: ValidationContext,
  visited: Set<number>,
): Promise<readonly string[]> {
  if (isTypeQueryNode(node)) {
    const symbol = await context.project.checker.getSymbolAtLocation(node.exprName)
    return symbol ? [await componentAtom(symbol, context)] : []
  }
  if (isTypeReferenceNode(node) || isExpressionWithTypeArguments(node)) {
    const alias = await context.project.checker.getSymbolAtLocation(isTypeReferenceNode(node) ? node.typeName : node.expression)
    const symbol = alias ? await resolveSymbol(alias, context) : null
    if (symbol && !visited.has(symbol.id)) {
      visited.add(symbol.id)
      const atoms: string[] = []
      for (const handle of symbol.declarations) {
        context.dependencyPaths.add(handle.path)
        const declaration = await handle.resolve(context.project)
        if (declaration && isTypeAliasDeclaration(declaration)) {
          atoms.push(...await typeQueryAtoms(declaration.type, context, visited))
        } else if (declaration && isInterfaceDeclaration(declaration)) {
          for (const clause of declaration.heritageClauses ?? []) {
            for (const type of clause.types) atoms.push(...await typeQueryAtoms(type, context, visited))
          }
          for (const member of declaration.members) {
            if ("type" in member && member.type) atoms.push(...await typeQueryAtoms(member.type as TypeNode, context, visited))
          }
        }
      }
      for (const argument of node.typeArguments ?? []) atoms.push(...await typeQueryAtoms(argument, context, visited))
      return atoms
    }
  }
  const nodes: Node[] = []
  node.forEachChild(child => { nodes.push(child) })
  const atoms: string[] = []
  for (const child of nodes) atoms.push(...await typeQueryAtoms(child, context, visited))
  return atoms
}
