/**
Статическое разрешение авторских контрактов JSX-слотов.

Явный тип результата компонента связывает принимающие области с разрешённым
содержимым. Проверка использует declarations и типы нативного TypeScript,
сохраняя различие компонентов с одинаковыми сигнатурами. Наличие схемы не
создаёт runtime metadata или регистрацию имён слотов.

@packageDocumentation
*/
import type {Node, JsxElement, JsxSelfClosingElement, Identifier} from "typescript/unstable/ast"
import {isFunctionDeclaration, isJsxElement, isJsxSelfClosingElement} from "typescript/unstable/ast/is"
import type {ValidateSlotContractsInput} from "./contract/input.ts"
import type {ValidateSlotContractsOutput} from "./contract/output.ts"
import type {ValidationContext} from "./src/model.ts"
import {containingReceiver} from "./src/content.ts"
import {receiverAt} from "./src/symbols.ts"
import {collectDependencies, validateAssignments} from "./src/validation.ts"

export type {ValidateSlotContractsInput} from "./contract/input.ts"
export type {ValidateSlotContractsOutput} from "./contract/output.ts"

/**
Проверяет типы, обязательность и количество назначений до JSX-трансляции.

Схема извлекается из явной `JSX.Element<Slots>` return annotation, в том числе
через type-only aliases и re-exports. Поле `default` обозначает безымянную
область. Одиночное поле допускает одного ребёнка, readonly массив — коллекцию,
которая может быть пустой. Необязательное одиночное поле допускает условное
отсутствие; обязательное требует доказуемого непустого значения.

@returns Предупреждения о нетипизированных получателях и пути semantic dependencies.
Untyped-содержимое сохраняет действующий контракт и не ограничивается этой проверкой.

@throws JsxCompileError — явная схема или назначение противоречат объявлениям;
ошибка содержит code, строку и столбец исходника. Неизвестное динамическое
содержимое constrained-области отклоняется явно, без структурного предположения.
*/
export default async function validateSlotContracts({sourceFile, project}: ValidateSlotContractsInput): Promise<ValidateSlotContractsOutput> {
  const context: ValidationContext = {
    project,
    receivers: new Map(),
    diagnostics: new Map(),
    dependencyPaths: new Set(),
    identityNames: new Map(),
    identityTypes: new Map(),
  }
  const functions: Identifier[] = []
  const calls: (JsxElement | JsxSelfClosingElement)[] = []
  const visit = (node: Node): void => {
    if (isFunctionDeclaration(node) && node.name) functions.push(node.name)
    if (isJsxElement(node) || isJsxSelfClosingElement(node)) calls.push(node)
    node.forEachChild(child => { visit(child) })
  }
  visit(sourceFile)
  for (const name of functions) await receiverAt(name, context)
  for (const element of calls) {
    const opening = isJsxElement(element) ? element.openingElement : element
    const tag = opening.tagName.getText(sourceFile)
    if (tag === "slot" || /^[a-z]/.test(tag)) continue
    const receiver = await receiverAt(opening.tagName, context)
    if (!receiver?.schema) continue
    await validateAssignments(element, receiver, await containingReceiver(element, context), context)
  }
  return Object.freeze({
    diagnostics: Object.freeze([...context.diagnostics.values()].map(diagnostic => Object.freeze(diagnostic))),
    dependencyPaths: Object.freeze(await collectDependencies(sourceFile, context)),
  })
}
