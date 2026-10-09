/**
Послойное прямоугольное 3D-дерево.

Измеренные Displays сохраняют размер и aspect. Каждый родитель упаковывает целые
области дочерних поддеревьев и передаёт им локальные трансляции. Глубина не меняет XY.
Тело каждого узла
сохраняет одинаковую глубину, независимую от межслойного шага; от его нижнего
торца начинаются прямоугольные ветви. Непересечение относится ко всем сечениям объёма, а не только к узлам.
Рендеринг, материалы, управление камерой и residency принадлежат потребителю.

@packageDocumentation
*/
import type {ImmersiveNodesLayoutPrismTree} from "./contract/index.ts"
import {solve} from "./src/solve.ts"

export type {ImmersiveNodesLayoutPrismTree} from "./contract/index.ts"

/** Рассчитывает конечный рабочий набор за O(n log n) времени и O(n) памяти, без рекурсии. */
export default function layoutPrismTree(input: ImmersiveNodesLayoutPrismTree.Input): ImmersiveNodesLayoutPrismTree.Output {
  return solve(input)
}
