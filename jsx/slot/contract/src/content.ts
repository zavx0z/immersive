import {TypeFlags, type Type} from "typescript/unstable/async"
import {skipOuterExpressions, SyntaxKind, type Expression, type JsxChild, type Node} from "typescript/unstable/ast"
import {
  isArrayLiteralExpression,
  isArrowFunction,
  isBinaryExpression,
  isBlock,
  isCallExpression,
  isConditionalExpression,
  isFunctionDeclaration,
  isJsxElement,
  isJsxExpression,
  isJsxFragment,
  isJsxSelfClosingElement,
  isJsxText,
  isPropertyAccessExpression,
  isSpreadElement,
} from "typescript/unstable/ast/is"
import SlotAuthoring from "@jsx-slot/authoring"
import {componentAtom, receiverAt} from "./symbols.ts"
import {isElementType} from "./schema.ts"
import type {ContentProof, Receiver, ValidationContext} from "./model.ts"

/** Пустота не является назначением, но отдельная явно заданная коллекция может быть пустой. */
export function emptyProof(assigned = false): ContentProof {
  return {atoms: new Set(), min: 0, max: 0, assigned, unknown: false}
}

/** Складывает соседей, сохраняя верхнюю границу даже для независимых условных позиций. */
export function joinedProof(proofs: readonly ContentProof[]): ContentProof {
  return {
    atoms: new Set(proofs.flatMap(proof => [...proof.atoms])),
    min: proofs.reduce((sum, proof) => sum + proof.min, 0),
    max: proofs.reduce((sum, proof) => sum + proof.max, 0),
    assigned: proofs.some(proof => proof.assigned),
    unknown: proofs.some(proof => proof.unknown),
  }
}

/** Сохраняет обе возможные ветви без предположений о значении условия при исполнении. */
function alternativeProof(left: ContentProof, right: ContentProof): ContentProof {
  return {
    atoms: new Set([...left.atoms, ...right.atoms]),
    min: Math.min(left.min, right.min),
    max: Math.max(left.max, right.max),
    assigned: left.assigned || right.assigned,
    unknown: left.unknown || right.unknown,
  }
}

/** Связывает статически доказанный вид с ровно одним значением содержимого. */
function atomicProof(atom: string): ContentProof {
  return {atoms: new Set([atom]), min: 1, max: 1, assigned: true, unknown: false}
}

/** Явно отмечает границу доказательства вместо структурного разрешения неизвестного ребёнка. */
function unknownProof(): ContentProof {
  return {atoms: new Set(), min: 0, max: Number.POSITIVE_INFINITY, assigned: true, unknown: true}
}

/** Находит явную схему компонента, внутри которого написана передача slot. */
export async function containingReceiver(node: Node, context: ValidationContext): Promise<Receiver | null> {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isFunctionDeclaration(parent)) return parent.name ? receiverAt(parent.name, context) : null
  }
  return null
}

/** Доказывает вид и количество назначенного JSX через нативный AST и checker. */
export async function contentProof(
  child: JsxChild,
  owner: Receiver | null,
  context: ValidationContext,
): Promise<ContentProof> {
  if (isJsxText(child)) return child.text.trim() === "" ? emptyProof() : atomicProof("string")
  if (isJsxExpression(child)) {
    return child.expression ? expressionProof(child.expression, owner, context) : emptyProof()
  }
  return expressionProof(child, owner, context)
}

/**
Учитывает JSX, условные ветви, фиксированные массивы и map, не исполняя выражения.
Другие динамические выражения разрешаются только по доказуемому native типу.
*/
async function expressionProof(
  original: Expression,
  owner: Receiver | null,
  context: ValidationContext,
): Promise<ContentProof> {
  const expression = skipOuterExpressions(original)
  if (isJsxElement(expression) || isJsxSelfClosingElement(expression)) {
    const opening = isJsxElement(expression) ? expression.openingElement : expression
    if (opening.tagName.getText(expression.getSourceFile()) === "slot") {
      const authoring = new SlotAuthoring(expression.getSourceFile())
      const name = authoring.attribute(expression, "name") ?? ""
      const field = owner?.schema?.get(name)
      if (!field) return unknownProof()
      const assigned: ContentProof = {
        atoms: field.atoms,
        min: field.optional || field.array ? 0 : 1,
        max: field.array ? Number.POSITIVE_INFINITY : 1,
        assigned: true,
        unknown: false,
      }
      if (!isJsxElement(expression) || assigned.min > 0) return assigned
      const fallback = joinedProof(await Promise.all(expression.children.map(child => contentProof(child, owner, context))))
      return {...alternativeProof(assigned, fallback), min: fallback.min}
    }
    const symbol = await context.project.checker.getSymbolAtLocation(opening.tagName)
    if (!symbol || /^[a-z]/.test(opening.tagName.getText(expression.getSourceFile()))) return atomicProof("element")
    return atomicProof(await componentAtom(symbol, context))
  }
  if (isJsxFragment(expression)) {
    return joinedProof(await Promise.all(expression.children.map(child => contentProof(child, owner, context))))
  }
  if (isConditionalExpression(expression)) {
    return alternativeProof(
      await expressionProof(expression.whenTrue, owner, context),
      await expressionProof(expression.whenFalse, owner, context),
    )
  }
  if (isBinaryExpression(expression) && expression.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken) {
    return alternativeProof(emptyProof(), await expressionProof(expression.right, owner, context))
  }
  if (isArrayLiteralExpression(expression)) {
    const proofs: ContentProof[] = []
    for (const element of expression.elements) {
      if (isSpreadElement(element)) proofs.push(await expressionProof(element.expression, owner, context))
      else if (element.kind === SyntaxKind.OmittedExpression) proofs.push(emptyProof())
      else proofs.push(await expressionProof(element, owner, context))
    }
    return {...joinedProof(proofs), assigned: true}
  }
  if (isCallExpression(expression) && isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === "map" && expression.arguments.length === 1) {
    const callback = expression.arguments[0]!
    if (isArrowFunction(callback) && !isBlock(callback.body)) {
      const proof = await expressionProof(callback.body, owner, context)
      return {...proof, min: 0, max: proof.max === 0 ? 0 : Number.POSITIVE_INFINITY, assigned: true}
    }
  }
  const type = await context.project.checker.getTypeAtLocation(original)
  return type ? nativeTypeProof(type, context) : unknownProof()
}

/**
Разрешает текст и общий JSX.Element динамически; identity конкретной функции
из такого Element не выводится. Nullable тип сохраняет возможное отсутствие.
*/
async function nativeTypeProof(type: Type, context: ValidationContext): Promise<ContentProof> {
  if (type.isErrorType() || (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0) return unknownProof()
  if (type.isUnionType()) {
    const parts = await type.getTypes()
    let proof = await nativeTypeProof(parts[0]!, context)
    for (const part of parts.slice(1)) proof = alternativeProof(proof, await nativeTypeProof(part, context))
    return proof
  }
  if ((type.flags & (TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void | TypeFlags.Never | TypeFlags.BooleanLike)) !== 0) return emptyProof()
  if ((type.flags & TypeFlags.StringLike) !== 0) {
    if (type.isStringLiteralType() && type.value === "") return emptyProof()
    const proof = atomicProof("string")
    return type.isStringLiteralType() ? proof : {...proof, min: 0}
  }
  if ((type.flags & TypeFlags.NumberLike) !== 0) return atomicProof("number")
  if ((type.flags & TypeFlags.BigIntLike) !== 0) return atomicProof("bigint")
  if (await isElementType(type, context)) return atomicProof("element")
  if (type.isTypeReference() && (
    await context.project.checker.isArrayType(type) ||
    (await (await type.getTarget()).getSymbol())?.name === "ReadonlyArray"
  )) {
    const elements = await context.project.checker.getTypeArguments(type)
    if (elements.length !== 1) return unknownProof()
    const proof = await nativeTypeProof(elements[0]!, context)
    return {...proof, min: 0, max: proof.max === 0 ? 0 : Number.POSITIVE_INFINITY, assigned: true}
  }
  return unknownProof()
}
