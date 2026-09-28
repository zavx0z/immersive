import type {JsxElement, JsxSelfClosingElement, Node} from "typescript/unstable/ast"
import {isJsxElement} from "typescript/unstable/ast/is"
import {SlotAuthoring} from "@jsx/authoring"
import {contentProof, emptyProof, joinedProof} from "./content.ts"
import {SlotContractError} from "./error.ts"
import type {ContentProof, Receiver, ValidationContext} from "./model.ts"

/** Проверяет назначения одного вызова по типам и количеству полей исходного получателя. */
export async function validateAssignments(
  element: JsxElement | JsxSelfClosingElement,
  receiver: Receiver,
  owner: Receiver | null,
  context: ValidationContext,
): Promise<void> {
  if (!receiver.schema) return
  const source = element.getSourceFile()
  const authoring = new SlotAuthoring(source)
  const groups = new Map<string, ContentProof[]>()
  for (const child of isJsxElement(element) ? element.children : []) {
    const proof = await contentProof(child, owner, context)
    if (!proof.assigned && proof.max === 0) continue
    const name = authoring.childName(child)
    if (!receiver.schema.has(name)) {
      throw new SlotContractError("JSX-SLOTS-NAME", `Компонент ${receiver.symbol.name} не объявляет слот ${name || "default"}`, child)
    }
    const group = groups.get(name) ?? []
    group.push(proof)
    groups.set(name, group)
  }
  for (const [name, field] of receiver.schema) {
    const proof = groups.has(name) ? joinedProof(groups.get(name)!) : emptyProof()
    const label = `${receiver.symbol.name}.${name || "default"}`
    if (proof.unknown) {
      throw new SlotContractError("JSX-SLOTS-UNPROVABLE", `Не удалось доказать тип динамического содержимого слота ${label}`, element)
    }
    for (const atom of proof.atoms) {
      const generalElement = field.atoms.has("element") && (atom === "element" || atom.startsWith("component:"))
      if (atom === "element" && !field.atoms.has("element")) {
        throw new SlotContractError("JSX-SLOTS-UNPROVABLE", `Общий JSX.Element не доказывает declaration identity содержимого слота ${label}`, element)
      }
      if (!field.atoms.has(atom) && !generalElement) {
        const actual = context.identityNames.get(atom) ?? atom
        const expected = [...field.atoms].map(value => context.identityNames.get(value) ?? value).join(" | ")
        throw new SlotContractError("JSX-SLOTS-TYPE", `Слот ${label} принимает ${expected}; назначено ${actual}`, element)
      }
    }
    if (!field.array && proof.max > 1) {
      throw new SlotContractError("JSX-SLOTS-CARDINALITY", `Одиночный слот ${label} может получить несколько детей; объявите readonly массив для коллекции`, element)
    }
    if (!field.optional && (field.array ? !proof.assigned : proof.min < 1)) {
      throw new SlotContractError("JSX-SLOTS-REQUIRED", `Обязательный слот ${label} должен быть назначен${field.array ? "" : " ровно одним непустым значением"}`, element)
    }
  }
}

/**
Возвращает исходники разрешённых объявлений, включая промежуточные alias handles.
Default libraries не являются авторскими контрактами и не добавляются в кэш владельца.
*/
export async function collectDependencies(source: Node, context: ValidationContext): Promise<readonly string[]> {
  const origin = source.getSourceFile().fileName
  const paths = new Set<string>()
  for (const path of context.dependencyPaths) {
    const metadata = await context.project.program.getSourceFileMetadata(path)
    if (metadata?.isDefaultLibrary) continue
    const file = await context.project.program.getSourceFile(path)
    const sourcePath = file?.fileName ?? path
    if (sourcePath !== origin) paths.add(sourcePath)
  }
  return [...paths].sort()
}
