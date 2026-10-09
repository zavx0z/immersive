import layoutPrismTree, {type ImmersiveNodesLayoutPrismTree} from "@zavx0z/immersive-nodes-layout-prism-tree"
import type {SpatialVolume} from "@zavx0z/immersive-space/shape/volumes"
import type {SpatialTreeNode} from "../contract/node.ts"

/** Миллиметры на CSS px; материализованные Display сохраняют прямую проекцию. */
export const SPATIAL_TREE_PIXEL_MM = .25
export const SPATIAL_TREE_HEADER = 24
const palette = ["#78abf1", "#81c6ad", "#d9b16d", "#b5a1dc", "#e194a9", "#77bbc7"]
type Rectangle = ImmersiveNodesLayoutPrismTree.Output["nodes"][number]["rect"]
export type SpatialTreeBounds = Readonly<{min: Readonly<{x: number; y: number; z: number}>; max: Readonly<{x: number; y: number; z: number}>}>
export type SpatialTreeDisplay = Readonly<{
  id: string
  parentId?: string
  label: string
  depth: number
  rect: Rectangle
  viewport: Readonly<{width: number; height: number}>
  color: string
}>

/** Неизменный снимок мировых тел, Display и ветвей. Не знает приложения — источника данных. */
export function createSpatialTreeScene(input: readonly SpatialTreeNode[], viewport: Readonly<{width: number; height: number}>, layoutOptions: ImmersiveNodesLayoutPrismTree.Input["options"] = {}) {
  const sources = new Map(input.map(node => [node.id, node]))
  const viewports = new Map(input.map(node => [node.id, node.viewport ?? viewport]))
  const largest = input.reduce((size, node) => {
    const v = viewports.get(node.id)!
    return Math.max(size, v.width * SPATIAL_TREE_PIXEL_MM, v.height * SPATIAL_TREE_PIXEL_MM)
  }, 240)
  const layerGap = layoutOptions.layerGap ?? largest * 3
  const bodyDepth = layoutOptions.bodyDepth ?? largest * 1.05
  const spacing = layoutOptions.spacing ?? largest * .24
  const layout = layoutPrismTree({nodes: input.map(node => {
    const size = viewports.get(node.id)!
    return {id: node.id, ...(node.parentId === undefined ? {} : {parentId: node.parentId}),
      width: size.width * SPATIAL_TREE_PIXEL_MM, height: size.height * SPATIAL_TREE_PIXEL_MM}
  }), options: {layerGap, spacing, aspectRatio: layoutOptions.aspectRatio ?? 1.5, bodyDepth}})
  const colors = new Map<string, string>()
  const roots = new Set(layout.layers[0]?.nodeIds ?? [])
  const branchIds = (roots.size === 1 ? layout.layers[1]?.nodeIds ?? [] : [...roots]).slice().sort()
  for (const [index, id] of branchIds.entries()) colors.set(id, `var(--spatial-tree-family-${index + 1}, ${palette[index % palette.length]})`)
  const layoutById = new Map(layout.nodes.map(node => [node.id, node]))
  for (const layer of layout.layers) for (const id of layer.nodeIds) {
    const node = layoutById.get(id)!
    colors.set(id, cssColor(sources.get(id)?.color) ?? colors.get(id) ?? (node.parentId === undefined
      ? "var(--spatial-tree-root-color, #a7b6c8)"
      : colors.get(node.parentId) ?? "var(--spatial-tree-root-color, #a7b6c8)"))
  }
  const nodes: readonly SpatialTreeDisplay[] = layout.nodes.map(node => ({
    ...node, label: sources.get(node.id)!.label, viewport: viewports.get(node.id)!, color: colors.get(node.id)!,
  }))
  const nodesById = new Map(nodes.map(node => [node.id, node]))
  const volumeOwnerById = new Map<string, string>()
  const bodyIdByNode = new Map(layout.stems.map(stem => [stem.nodeId, stem.id]))
  const bodyVolumes: readonly SpatialVolume[] = layout.stems.map(stem => {
    volumeOwnerById.set(stem.id, stem.nodeId)
    return {id: stem.id, from: stem.top, to: stem.bottom, color: colors.get(stem.nodeId)!, caps: true}
  })
  const branchVolumes: readonly SpatialVolume[] = layout.branches.map(branch => {
    volumeOwnerById.set(branch.id, branch.childId)
    return {id: branch.id, from: branch.from, to: branch.to, color: colors.get(branch.childId)!, caps: false, interactive: false}
  })
  const volumes: readonly SpatialVolume[] = [...bodyVolumes, ...branchVolumes]
  const b = layout.bounds
  const bounds: SpatialTreeBounds = {min: {x: b.x, y: b.y, z: b.z}, max: {x: b.x + b.width, y: b.y + b.height, z: b.z + b.depth}}
  const floorSize = Math.max(4_000, Math.ceil(Math.max(b.width, b.height) * 4 / 1_000) * 1_000)
  const floor = {size: floorSize, divisions: 128, distanceFade: floorSize,
    position: {x: b.x + b.width / 2, y: b.y + b.height / 2, z: 0}}
  const floorBounds: SpatialTreeBounds = {
    min: {x: floor.position.x - floorSize / 2, y: floor.position.y - floorSize / 2, z: 0},
    max: {x: floor.position.x + floorSize / 2, y: floor.position.y + floorSize / 2, z: 0},
  }
  return {nodes, nodesById, volumes, bodyVolumes, branchVolumes, volumeOwnerById, bodyIdByNode, bounds, floor, floorBounds, layout, layerGap}
}
export type SpatialTreeScene = ReturnType<typeof createSpatialTreeScene>

/** RGB остаётся цветом и для CSS Frame, и для пространственного материала. */
function cssColor(value: string | number | undefined): string | undefined {
  if (typeof value !== "number") return value
  if (!Number.isInteger(value) || value < 0 || value > 0xffffff) throw new RangeError("Spatial tree RGB color must be an integer between 0 and 0xffffff")
  return `#${value.toString(16).padStart(6, "0")}`
}
