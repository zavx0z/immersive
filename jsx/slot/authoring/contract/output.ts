import type {FunctionDeclaration, JsxChild, JsxElement, JsxSelfClosingElement} from "typescript/unstable/ast"
import type {Expression} from "typescript/unstable/ast"
import type {Project} from "typescript/unstable/async"
import type {JsxOrigin} from "../src/origins.ts"

/** Синтаксический контракт точек вставки и назначений одного JSX-файла. */
export interface SlotAuthoringOutput {
  validate(): void
  outlets(declaration: FunctionDeclaration): readonly string[]
  childName(child: JsxChild): string
  origins(expression: Expression, project: Project): Promise<readonly JsxOrigin[] | null>
  originName(origins: readonly JsxOrigin[]): string
  attribute(element: JsxElement | JsxSelfClosingElement, name: "name" | "slot"): string | undefined
  prepare(transportModule?: string): string
}
