import type {FunctionComponent} from "@zavx0z/immersive-component"
import type {Zavx0zImmersiveNodesNodeParameter} from "@zavx0z/immersive-nodes-node-parameter"
type ParameterNodeProps = Zavx0zImmersiveNodesNodeParameter.Input
import type {Zavx0zImmersiveNodesNode} from "@zavx0z/immersive-nodes-node/contract"
type NodeChildren = Zavx0zImmersiveNodesNode.Output | readonly Zavx0zImmersiveNodesNode.Output[] | null | undefined
import type {Zavx0zImmersiveNodesGeometryNodeProject} from "@zavx0z/immersive-nodes-geometry-node-project"
type NodeKind = NonNullable<NonNullable<Zavx0zImmersiveNodesGeometryNodeProject.Input[4]>["kind"]>
type NodeShape = NonNullable<NonNullable<Zavx0zImmersiveNodesGeometryNodeProject.Input[4]>["shape"]>
import type {NodeTreeExternalStore, NodeTreeSnapshot, ParameterSnapshot} from "@zavx0z/immersive-nodes-tree"
import type {LayoutResult} from "@zavx0z/immersive-nodes-layout/types"
import type {Zavx0zImmersiveNodesProjectionParameter} from "@zavx0z/immersive-nodes-projection-parameter"
type ParameterInput = Parameters<NonNullable<Zavx0zImmersiveNodesProjectionParameter.Input["onInput"]>>[0]
import type {NodeGeometryIndex, NodeRect, NodeTreeTransform, NodeTreeViewport} from "../projection/geometry.ts"
import type {LinkRoute} from "../routing/link-path.ts"

export type NodeTreeStore = NodeTreeExternalStore<NodeTreeSnapshot, ParameterSnapshot>
export const nodeTreeLayoutBrand: unique symbol = Symbol("NodeTreeLayout")

/** One validated layout bound to the exact source snapshot used to compute it. */
export type NodeTreeLayout = Readonly<{
  [nodeTreeLayoutBrand]: true
  snapshot: NodeTreeSnapshot
  layout: LayoutResult
}>

export type NodeTreeSelection =
  | Readonly<{kind: "frame" | "link" | "node"; id: string}>
  | null

/**
Проекция единственного Store в одном semantic дереве.

@property store - Исходный Store; адресные Parameter Stores сохраняют identity.

@property layout - Готовая геометрия или receipt, связанный с точным snapshot и source Store.

@property [materializeCulled] - Сохраняет компоненты вне viewport скрытыми вместо исключения из проекции.

@property [viewport] - Область видимости в координатах дерева; не выполняет раскладку.
*/
export type NodePresentationState = Readonly<{
  collapsedNodeIds?: ReadonlySet<string> | undefined
  previewNodeIds?: ReadonlySet<string> | undefined
  nodeKinds?: ReadonlyMap<string, NodeKind> | undefined
  nodeShapes?: ReadonlyMap<string, NodeShape> | undefined
}>
export type NodeTreeLayoutComputer = (snapshot: NodeTreeSnapshot, presentation: NodePresentationState) => LayoutResult

/**
Подключённое представление получает принятый снимок, геометрию графа и адресные действия.
Вычисленный rect содержит полную геометрию, включая height; сокращённый вход
ParameterNode для естественного размера не сужает данные адаптера графа.
*/
export type NodeViewProps = Omit<ParameterNodeProps, "rect"> & Readonly<{
  rect?: NodeRect | undefined
  snapshot: NodeTreeSnapshot["nodes"][number]
  contentVisible: boolean
  shape?: NodeShape | undefined
  onContentVisibleChange?: ((visible: boolean, event: Event) => void) | undefined
}>
export type NodeView = FunctionComponent<NodeViewProps>

export type NodeTreeProps = Readonly<{
  store: NodeTreeStore
  nodeKinds?: ReadonlyMap<string, NodeKind> | undefined
  nodeShapes?: ReadonlyMap<string, NodeShape> | undefined
  nodeContent?: ReadonlyMap<string, NodeChildren> | undefined
  nodeViews?: ReadonlyMap<string, NodeView> | undefined
  label?: string | undefined
  layout: LayoutResult | NodeTreeLayout | NodeTreeLayoutComputer
  viewport?: NodeTreeViewport | undefined
  materializeCulled?: boolean | undefined
  transform?: NodeTreeTransform | undefined
  selection?: NodeTreeSelection | undefined
  collapsedNodeIds?: ReadonlySet<string> | undefined
  previewNodeIds?: ReadonlySet<string> | undefined
  style?: CssStyle | undefined
  onSelectionChange?: ((selection: NodeTreeSelection, event: Event) => void) | undefined
  onNodeCollapseChange?: ((nodeId: string, collapsed: boolean, event: Event) => void) | undefined
  onNodePreviewChange?: ((nodeId: string, enabled: boolean, event: Event) => void) | undefined
  onParameterInput?: ((change: ParameterInput, event: Event) => void) | undefined
  onParameterChange?: ((change: ParameterInput, event: Event) => void) | undefined
  onSocketActivate?: ((nodeId: string, socketId: string, event: Event) => void) | undefined
}>

export type UiSnapshot = NodeTreeSnapshot
export type UiNode = UiSnapshot["nodes"][number]
export type UiFrame = UiSnapshot["frames"][number]
export type UiLink = UiSnapshot["links"][number]

export type VisibleNode = Readonly<{node: UiNode; rect: NodeRect; culled: boolean}>
export type VisibleFrame = Readonly<{frame: UiFrame; rect: NodeRect; culled: boolean}>
export type VisibleLink = Readonly<{link: UiLink; route: LinkRoute; bounds: NodeRect; culled: boolean}>

export type NodeTreeView = Readonly<{
  frames: readonly VisibleFrame[]
  nodes: readonly VisibleNode[]
  links: readonly VisibleLink[]
  nodeById: ReadonlyMap<string, UiNode>
  frameById: ReadonlyMap<string, UiFrame>
  visibleNodeIds: ReadonlySet<string>
  visibleFrameIds: ReadonlySet<string>
  connectedSocketKeys: ReadonlySet<string>
  geometry: NodeGeometryIndex
}>

export type NodeTreeActions = Readonly<{
  parameterInput(change: ParameterInput, event: Event): void
  parameterChange(change: ParameterInput, event: Event): void
  selectFrame(id: string): (event: Event) => void
  selectLink(id: string): (event: Event) => void
  selectNode(id: string): (event: Event) => void
  collapseNode(id: string): (collapsed: boolean, event: Event) => void
  previewNode(id: string): (enabled: boolean, event: Event) => void
  socket(nodeId: string): (socketId: string, event: Event) => void
  parameterStore(nodeId: string): (parameterId: string) => ReturnType<NodeTreeStore["parameter"]>
}>
