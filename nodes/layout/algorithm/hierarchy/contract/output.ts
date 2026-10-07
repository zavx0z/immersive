import type {LayoutNodeGeometry, LayoutRectangle} from "../../../protocol/types/src/protocol.ts"
import type {HierarchyLayoutEdge} from "./edge.ts"

/**
Геометрия всего леса в логических пикселях, ось Y направлена вниз.

Узлы сохраняют входной порядок и размеры. Родители центрируются в областях
своих поддеревьев; все узлы одной глубины начинаются на одной высоте. Соседние
поддеревья не пересекаются, слой учитывает максимальную высоту своих карточек.
Bounds включают все карточки и маршруты, начинаются в (0, 0); пустой лес имеет
нулевые bounds. Маршруты могут разделять общие участки у одного родителя.
*/
export interface HierarchyLayoutOutput {
  readonly direction: "DOWN"
  readonly bounds: LayoutRectangle
  readonly nodes: readonly LayoutNodeGeometry[]
  readonly edges: readonly HierarchyLayoutEdge[]
}
