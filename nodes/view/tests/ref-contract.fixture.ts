import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Element as SemanticElement} from "@zavx0z/immersive-dom"
import type {Zavx0zImmersiveNodesNodeDiagram} from "@zavx0z/immersive-nodes-node-diagram"
type DiagramNodeProps = Zavx0zImmersiveNodesNodeDiagram.Input

/** Минимальное type-воспроизведение: JSX ref типизирован нативным HTMLElement. */
export function checkRefContract(native: JSX.Ref<HTMLElement>, semantic: (element: SemanticElement | null) => void) {
  const accepted: DiagramNodeProps["elementRef"] = native
  // @ts-expect-error Semantic Element структурно отличается от HTMLElement авторского JSX.
  const mismatch: JSX.Ref<HTMLElement> = semantic
  return {accepted, mismatch}
}
