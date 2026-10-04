import type {JSX} from "@immersive-jsx-compiler/session"
import type {Element as SemanticElement} from "@immersive/dom"
import type {ImmersiveNodesNodeDiagram} from "@immersive-nodes-node/diagram"
type DiagramNodeProps = ImmersiveNodesNodeDiagram.Input

/** Минимальное type-воспроизведение: JSX ref типизирован нативным HTMLElement. */
export function checkRefContract(native: JSX.Ref<HTMLElement>, semantic: (element: SemanticElement | null) => void) {
  const accepted: DiagramNodeProps["elementRef"] = native
  // @ts-expect-error Semantic Element структурно отличается от HTMLElement авторского JSX.
  const mismatch: JSX.Ref<HTMLElement> = semantic
  return {accepted, mismatch}
}
