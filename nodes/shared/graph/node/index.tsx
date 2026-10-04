import {component, memo} from "@immersive/component"
import type {CompiledTemplate} from "@immersive/template/compiled"
import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveNodesNode} from "@immersive-nodes/node/contract"
type NodeChildren = ImmersiveNodesNode.Output | readonly ImmersiveNodesNode.Output[] | null | undefined
import type {GraphRenderedNode, GraphNodeProps} from "../contracts.ts"
import {GraphNodeSlot} from "./content/index.tsx"

/** Монтирует переданный TSX с устойчивым ключом без дополнительного DOM-контейнера. */
export function GraphNodeContent(props: Readonly<{
  node: GraphRenderedNode
  selected: boolean
  hidden: boolean
  onActivate: (event: Event) => void
  intrinsic?: GraphNodeProps["intrinsic"]
  elementRef?: GraphNodeProps["elementRef"]
}>) {
  const content: NodeChildren = renderNode(props.node, {
    id: props.node.id,
    rect: props.node.rect,
    data: props.node.data,
    selected: props.selected,
    hidden: props.hidden,
    onActivate: props.onActivate,
    intrinsic: props.intrinsic,
    elementRef: props.elementRef,
  })
  return <GraphNodeSlot>{content}</GraphNodeSlot>
}

export const MemoGraphNodeContent = memo(GraphNodeContent, (previous, next) =>
  previous.node === next.node && previous.selected === next.selected && previous.hidden === next.hidden &&
  previous.onActivate === next.onActivate && previous.intrinsic === next.intrinsic && previous.elementRef === next.elementRef)

function renderNode(node: GraphRenderedNode, props: GraphNodeProps): NodeChildren {
  return component(node.view as unknown as CompiledTemplate<GraphNodeProps>, props, node.id) as unknown as JSX.Element
}
