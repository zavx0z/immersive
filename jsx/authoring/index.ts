/**
Синтаксис JSX-слотов: буквальные имена, вложенное содержимое и транспорт позиций.

Одна проверка используется компилятором и подготовкой сценариев до JSX-трансляции.
Имена не вычисляются, children и spread не заменяют авторскую вложенность.

@packageDocumentation
*/
import type {FunctionDeclaration, JsxChild, JsxElement, JsxSelfClosingElement} from "typescript/unstable/ast"
import type {SlotAuthoringInput} from "./contract/input.ts"
import type {SlotAuthoringOutput} from "./contract/output.ts"
import {validateSlotAuthoring, readSlotOutlets, readSlotChildName, slotAttribute, prepareSlotAuthoring} from "./src/syntax.ts"
export type {SlotAuthoringInput} from "./contract/input.ts"
export type {SlotAuthoringOutput} from "./contract/output.ts"

/** Привязывает операции слотов к одному неизменяемому AST. */
export class SlotAuthoring implements SlotAuthoringOutput {
  constructor(private readonly source: SlotAuthoringInput) {}

  validate(): void { validateSlotAuthoring(this.source) }

  outlets(declaration: FunctionDeclaration): readonly string[] {
    return readSlotOutlets(declaration, this.source)
  }

  childName(child: JsxChild): string { return readSlotChildName(child, this.source) }

  attribute(element: JsxElement | JsxSelfClosingElement, name: "name" | "slot"): string | undefined {
    return slotAttribute(element, name, this.source)
  }

  prepare(transportModule?: string): string { return prepareSlotAuthoring(this.source, transportModule) }
}
