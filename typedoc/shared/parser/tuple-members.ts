import {ElementFlags, NodeBuilderFlags, SymbolFlags, type Project, type Type} from "typescript/unstable/async"
import {isNamedTupleMember, isOptionalTypeNode, isSourceFile, isTupleTypeNode, isTypeAliasDeclaration, isTypeOperatorNode, isTypeReferenceNode, type Node, type TupleTypeNode, type TypeNode} from "typescript/unstable/ast"
import type {TypeDocMember} from "../types/model.ts"
import type {documentation} from "./documentation.ts"

/**
Проецирует элементы tuple в {@link TypeDocMember}, сохраняя метки, optional и тип элемента.
Отдельного rest-флага в модели нет: rest-элемент получает свой тип, например `boolean[]`,
а синтаксис `...` остаётся в исходной сигнатуре декларации.
Методы массива и его `length` не становятся строками справочника.

@param project - Проект с checker и emitter той же сессии, что породила type и declaration.

@param type - Эффективный тип декларации; проверяется reference-target tuple.

@param declaration - Исходный AST-узел для контекста разрешения типов и диагностики.

@param docs - Результат {@link documentation} для этой декларации.
Имена `@property` сопоставляются меткам tuple либо строковым индексам с нуля.

@returns Массив элементов в исходном порядке, включая пустой массив для `[]`;
`undefined`, когда type не является tuple reference.

Исходный tuple-узел и объявления alias сохраняют авторские метки, когда их
число элементов совпадает с эффективным типом; variadic instantiation берёт
развёрнутую форму emitter. Типы
элементов непрямого alias берутся из checker или emitter, а optional — из
native metadata checker. Для tuple внутри namespace текст элемента остаётся
авторским. Если ни исходный узел, ни alias, ни emitter не дают tuple, parser
отклоняет документ, чтобы не заменять именованные элементы числовыми индексами.

@example
При `project`, `type` и `declaration`, полученных из одной сессии TypeScript:
```ts
const members = await tupleMembers(project, type, declaration, docs)
// readonly [first: string, second?: number] даёт строки first и second.
```
*/
export async function tupleMembers(
  project: Project,
  type: Type,
  declaration: Node,
  docs: ReturnType<typeof documentation> | undefined,
): Promise<TypeDocMember[] | undefined> {
  if (!type.isTypeReference() || !(await type.getTarget()).isTupleType()) return undefined
  const target = await type.getTarget()
  const elements = await project.checker.getTypeArguments(type)
  const written = isTypeAliasDeclaration(declaration) ? declaration.type : undefined
  const unwrapped = written && isTypeOperatorNode(written) ? written.type : written
  const direct = unwrapped && isTupleTypeNode(unwrapped) ? unwrapped : undefined
  const aliased = !direct && written ? await aliasTuple(project, written, new Set()) : undefined
  const emitted = await project.checker.typeToTypeNode(
    type, declaration, NodeBuilderFlags.InTypeAlias | NodeBuilderFlags.NoTruncation | NodeBuilderFlags.AllowEmptyTuple,
  )
  const expanded = emitted && isTypeOperatorNode(emitted) ? emitted.type : emitted
  const generated = expanded && isTupleTypeNode(expanded) ? expanded : undefined
  const tuple = [direct, aliased, generated].find(candidate => candidate?.elements.length === elements.length)
  if (!tuple) throw new Error(`TypeDoc: не удалось прочитать элементы tuple: ${declaration.getSourceFile().fileName}`)
  return Promise.all(elements.map(async (elementType, index) => {
    const element = tuple.elements[index]
    const named = element && isNamedTupleMember(element) ? element : undefined
    const name = named?.name.text ?? String(index)
    const property = docs?.properties.get(name)
    const displayElement = direct && !isSourceFile(declaration.parent)
      ? element
      : generated?.elements[index] ?? (direct ? element : undefined)
    const displayNamed = displayElement && isNamedTupleMember(displayElement) ? displayElement : undefined
    const writtenType = displayNamed?.type ?? (displayElement && isOptionalTypeNode(displayElement) ? displayElement.type : displayElement)
    const rest = target.isTupleType() && !!(target.elementFlags[index]! & (ElementFlags.Rest | ElementFlags.Variadic))
    const resolvedType = await project.checker.typeToString(elementType, declaration)
    return {
      name,
      type: writtenType ? await project.emitter.printNode(writtenType) : rest ? `${resolvedType}[]` : resolvedType,
      optional: target.isTupleType() && !!(target.elementFlags[index]! & ElementFlags.Optional),
      description: property?.description ?? "",
      ...(property?.defaultValue === undefined ? {} : {defaultValue: property.defaultValue}),
    }
  }))
}

/** Разрешает цепочку собственных и импортированных type alias через символы checker. */
async function aliasTuple(project: Project, written: TypeNode, seen: Set<number>): Promise<TupleTypeNode | undefined> {
  const node = isTypeOperatorNode(written) ? written.type : written
  if (isTupleTypeNode(node)) return node
  if (!isTypeReferenceNode(node)) return undefined
  const exported = await project.checker.getSymbolAtLocation(node.typeName)
  if (!exported) return undefined
  const symbol = exported.flags & SymbolFlags.Alias ? await project.checker.getAliasedSymbol(exported) : exported
  if (seen.has(symbol.id)) return undefined
  seen.add(symbol.id)
  for (const handle of symbol.declarations) {
    const declaration = await handle.resolve()
    if (declaration && isTypeAliasDeclaration(declaration)) {
      const tuple = await aliasTuple(project, declaration.type, seen)
      if (tuple) return tuple
    }
  }
  return undefined
}
