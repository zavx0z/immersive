/**
Синтаксис JSX-слотов: буквальные имена, вложенное содержимое и транспорт позиций.

Сценарии используют явную проверку; компилятор читает точки вставки и назначения
для преобразования уже проверенного исходника.
Имена не вычисляются, children и spread не заменяют авторскую вложенность.

@packageDocumentation
*/
import type {FunctionDeclaration, JsxChild, JsxElement, JsxSelfClosingElement} from "typescript/unstable/ast"
import type {Expression} from "typescript/unstable/ast"
import type {Project} from "typescript/unstable/async"
import {readJsxOrigins, type JsxOrigin} from "./src/origins.ts"
import JsxCompileError from "@zavx0z/immersive-jsx-compiler-error"
import {isJsxFragment, isJsxText} from "typescript/unstable/ast/is"
export type {JsxOrigin} from "./src/origins.ts"
import type {SlotAuthoringInput} from "./contract/input.ts"
import type {SlotAuthoringOutput} from "./contract/output.ts"
import {validateSlotAuthoring, readSlotOutlets, readSlotChildName, slotAttribute, prepareSlotAuthoring} from "./src/syntax.ts"
export type {SlotAuthoringInput} from "./contract/input.ts"
export type {SlotAuthoringOutput} from "./contract/output.ts"

/** Поле default в типовом контракте обозначает безымянную JSX-точку вставки. */
export function slotNameForField(name: string): string { return name === "default" ? "" : name }

/** Привязывает операции слотов к одному неизменяемому AST. */
export default class SlotAuthoring implements SlotAuthoringOutput {
  constructor(private readonly source: SlotAuthoringInput) {}

  validate(): void { validateSlotAuthoring(this.source) }

  outlets(declaration: FunctionDeclaration): readonly string[] {
    return readSlotOutlets(declaration, this.source)
  }

  childName(child: JsxChild): string { return readSlotChildName(child, this.source) }

  origins(expression: Expression, project: Project) { return readJsxOrigins(this.source, expression, project) }

  originName(origins: readonly JsxOrigin[]): string {
    const names = new Set<string>()
    const visit = (origin: JsxOrigin) => {
      if (isJsxFragment(origin)) {
        for (const child of origin.children) if (!isJsxText(child) || child.text.trim() !== "") names.add(this.childName(child))
      } else names.add(this.childName(origin))
    }
    origins.forEach(visit)
    if (names.size > 1) throw new JsxCompileError("Условные ветви должны назначаться одному статическому слоту", this.source.fileName)
    return names.values().next().value ?? ""
  }

  attribute(element: JsxElement | JsxSelfClosingElement, name: "name" | "slot"): string | undefined {
    return slotAttribute(element, name, this.source)
  }

  prepare(transportModule?: string): string { return prepareSlotAuthoring(this.source, transportModule) }
}
