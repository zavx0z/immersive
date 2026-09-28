import type {Expression, FunctionDeclaration, JsxChild, JsxElement, JsxSelfClosingElement, Node, SourceFile} from "typescript/unstable/ast"
import {skipOuterExpressions} from "typescript/unstable/ast"
import {isArrowFunction, isBlock, isCallExpression, isConditionalExpression, isFunctionDeclaration, isIdentifier, isJsxAttribute, isJsxElement, isJsxExpression, isJsxSelfClosingElement, isJsxSpreadAttribute, isNullLiteral, isPropertyAccessExpression, isStringLiteral} from "typescript/unstable/ast/is"
import {planSlots} from "../index.ts"
import {JsxCompileError} from "../../compiler/errors.ts"

/** Читает буквальное имя назначения или точки вставки без вычисления авторского кода. */
export function slotAttribute(
  element: JsxElement | JsxSelfClosingElement,
  name: "name" | "slot",
  source: SourceFile,
): string | undefined {
  const opening = isJsxElement(element) ? element.openingElement : element
  for (const attribute of opening.attributes.properties) {
    if (!isJsxAttribute(attribute) || attribute.name.getText(source) !== name) continue
    const value = attribute.initializer
    if (value && isStringLiteral(value)) return value.text
    if (value && isJsxExpression(value) && value.expression && isStringLiteral(value.expression)) {
      return value.expression.text
    }
    throw new JsxCompileError(`Атрибут ${name} требует статическое строковое имя слота`, source.fileName)
  }
  return undefined
}

/** Проверяет единые правила авторства также в TSX сценариев, не компилируя их callbacks. */
export function validateSlotAuthoring(source: SourceFile): void {
  const walk = (node: Node): void => {
    if (isJsxElement(node) || isJsxSelfClosingElement(node)) {
      const opening = isJsxElement(node) ? node.openingElement : node
      const tag = opening.tagName.getText(source)
      if (tag === "slot" || /^[A-Z]/.test(tag)) {
        for (const attribute of opening.attributes.properties) {
          if (isJsxSpreadAttribute(attribute)) {
            throw new JsxCompileError(tag === "slot"
              ? "Атрибуты slot задаются явно, spread запрещён"
              : "component prop spreads are unsupported", source.fileName)
          }
          if (!isJsxAttribute(attribute)) continue
          const name = attribute.name.getText(source)
          if (name === "children") {
            throw new JsxCompileError(tag === "slot"
              ? "Содержимое slot задаётся между тегами, атрибут children запрещён"
              : "component children must be authored between component tags", source.fileName)
          }
          if (tag === "slot" && name !== "name" && name !== "slot") {
            throw new JsxCompileError(`Атрибут ${name} не поддерживается у slot`, source.fileName)
          }
        }
        slotAttribute(node, "slot", source)
        if (tag === "slot") slotAttribute(node, "name", source)
      }
    }
    node.forEachChild(child => { walk(child) })
  }
  walk(source)
}

/** Находит точки вставки текущего компонента, не заходя в чужие объявления функций. */
export function readSlotOutlets(declaration: FunctionDeclaration, source: SourceFile): readonly string[] {
  const names: string[] = []
  const walk = (node: Node): void => {
    if (isFunctionDeclaration(node) && node !== declaration) return
    if (isJsxElement(node) || isJsxSelfClosingElement(node)) {
      const opening = isJsxElement(node) ? node.openingElement : node
      if (opening.tagName.getText(source) === "slot") names.push(slotAttribute(node, "name", source) ?? "")
    }
    node.forEachChild(child => { walk(child) })
  }
  walk(declaration)
  try { planSlots({outlets: names, children: []}) } catch (error) {
    throw new JsxCompileError(error instanceof Error ? error.message : String(error), source.fileName)
  }
  return names
}

/** Определяет статическое назначение позиции, сохраняя его для null и пустого map. */
export function readSlotChildName(child: JsxChild, source: SourceFile): string {
  const assignment = (value: Expression): string | null => {
    const expression = skipOuterExpressions(value)
    if (isNullLiteral(expression) || (isIdentifier(expression) && expression.text === "undefined")) return null
    if (isJsxElement(expression) || isJsxSelfClosingElement(expression)) {
      return slotAttribute(expression, "slot", source) ?? ""
    }
    if (isConditionalExpression(expression)) {
      const names = [assignment(expression.whenTrue), assignment(expression.whenFalse)].filter(name => name !== null)
      if (new Set(names).size > 1) {
        throw new JsxCompileError("Условные ветви должны назначаться одному статическому слоту", source.fileName)
      }
      return names[0] ?? ""
    }
    if (isCallExpression(expression) && isPropertyAccessExpression(expression.expression) &&
      expression.expression.name.text === "map" && expression.arguments.length === 1) {
      const callback = expression.arguments[0]!
      if (isArrowFunction(callback) && !isBlock(callback.body)) return assignment(callback.body)
    }
    return ""
  }
  if (isJsxElement(child) || isJsxSelfClosingElement(child)) return assignment(child) ?? ""
  if (isJsxExpression(child) && child.expression) return assignment(child.expression) ?? ""
  return ""
}

/** Дополняет тестовый JSX метаданными синтаксических позиций до штатной трансляции Bun. */
export function prepareSlotAuthoring(source: SourceFile, transportModule?: string): string {
  validateSlotAuthoring(source)
  if (transportModule === undefined) return source.text
  let helper = "__templateSlotChild"
  while (source.text.includes(helper)) helper += "_"
  const inserts: {position: number; text: string}[] = []
  const walk = (node: Node): void => {
    if (isJsxExpression(node) && node.expression && isJsxElement(node.parent)) {
      const value = skipOuterExpressions(node.expression)
      let kind: "conditional" | "keyed" | null = null
      if (isConditionalExpression(value)) {
        const branches = [skipOuterExpressions(value.whenTrue), skipOuterExpressions(value.whenFalse)]
        if (branches.some(branch => isJsxElement(branch) || isJsxSelfClosingElement(branch))) kind = "conditional"
      }
      if (isCallExpression(value) && isPropertyAccessExpression(value.expression) && value.expression.name.text === "map") {
        const callback = value.arguments[0]
        if (callback && isArrowFunction(callback) && !isBlock(callback.body)) {
          const body = skipOuterExpressions(callback.body)
          if (isJsxElement(body) || isJsxSelfClosingElement(body)) {
            const opening = isJsxElement(body) ? body.openingElement : body
            if (!opening.attributes.properties.some(attribute => isJsxAttribute(attribute) && attribute.name.getText(source) === "key")) {
              throw new JsxCompileError("dynamic JSX map components require key", source.fileName)
            }
            kind = "keyed"
          }
        }
      }
      if (kind) {
        const name = readSlotChildName(node, source)
        inserts.push({position: node.expression.getStart(source), text: `${helper}(${JSON.stringify(name)}, (`})
        inserts.push({position: node.expression.getEnd(), text: `), ${JSON.stringify(kind)})`})
      }
    }
    node.forEachChild(child => { walk(child) })
  }
  walk(source)
  if (inserts.length === 0) return source.text
  let result = source.text
  for (const insert of inserts.sort((left, right) => right.position - left.position)) {
    result = result.slice(0, insert.position) + insert.text + result.slice(insert.position)
  }
  return `import {slotChild as ${helper}} from ${JSON.stringify(transportModule)}\n${result}`
}
