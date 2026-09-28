import type {FunctionDeclaration, JsxChild, JsxElement, JsxSelfClosingElement} from "typescript/unstable/ast"

/** Синтаксический контракт точек вставки и назначений одного JSX-файла. */
export interface SlotAuthoringOutput {
  validate(): void
  outlets(declaration: FunctionDeclaration): readonly string[]
  childName(child: JsxChild): string
  attribute(element: JsxElement | JsxSelfClosingElement, name: "name" | "slot"): string | undefined
  prepare(transportModule?: string): string
}
