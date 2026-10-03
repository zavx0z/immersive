import type {JSX} from "@jsx-compiler/session"
import type {Element as SemanticElement} from "@zavx0z/dom"
import type {NodesNodeDiagram} from "@nodes-node/diagram"
type DiagramNodeProps = NodesNodeDiagram.Input

/** Минимальное type-воспроизведение: JSX ref типизирован нативным HTMLElement. */
export function checkRefContract(native: JSX.Ref<HTMLElement>, semantic: (element: SemanticElement | null) => void) {
  const accepted: DiagramNodeProps["elementRef"] = native
  // @ts-expect-error Semantic Element структурно отличается от HTMLElement авторского JSX.
  const mismatch: JSX.Ref<HTMLElement> = semantic
  return {accepted, mismatch}
}
