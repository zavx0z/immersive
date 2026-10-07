/**
Вертикальная числовая раскладка измеренного иерархического леса.

Каждый узел имеет единственного родителя. Поддеревья занимают непересекающиеся
горизонтальные области, размеры карточек сохраняются. Итеративные проходы
используют O(n) времени и памяти без ограничения глубины стеком вызовов.
DOM, модель графа, viewport, камера и отображение остаются у потребителя.

@packageDocumentation
*/

import {solveHierarchy} from "./src/solve.ts"
import type {HierarchyLayoutInput} from "./contract/input.ts"
import type {HierarchyLayoutOutput} from "./contract/output.ts"

export type {HierarchyLayoutInput} from "./contract/input.ts"
export type {HierarchyLayoutNode} from "./contract/node.ts"
export type {HierarchyLayoutOptions} from "./contract/options.ts"
export type {HierarchyLayoutEdge} from "./contract/edge.ts"
export type {HierarchyLayoutOutput} from "./contract/output.ts"
export {
  HierarchyLayoutError,
  type HierarchyLayoutErrorCode,
  type HierarchyLayoutWitness,
} from "./src/error.ts"

/**
Рассчитывает все узлы леса и ортогональные маршруты parentId → id.

@param input - Измеренные карточки и расстояния между поддеревьями и слоями.
@returns Полная геометрия в логических пикселях с исходным порядком узлов.
@throws {@link HierarchyLayoutError} при дубликате, неизвестном родителе,
цикле, некорректном размере или переполнении координат.
*/
export function layoutHierarchy(input: HierarchyLayoutInput): HierarchyLayoutOutput {
  return solveHierarchy(input)
}
