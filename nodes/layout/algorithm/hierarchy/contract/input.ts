import type {HierarchyLayoutNode} from "./node.ts"
import type {HierarchyLayoutOptions} from "./options.ts"

/**
Вход вертикальной раскладки леса с единственным родителем каждого узла.

Размеры должны быть конечными положительными числами. Идентификаторы уникальны,
каждый parentId ссылается на существующий узел, циклы запрещены. Входной порядок
определяет порядок корней и детей; родитель может находиться после своего ребёнка.
Layout не меняет входные данные и не измеряет содержимое карточек.
*/
export interface HierarchyLayoutInput {
  readonly nodes: readonly HierarchyLayoutNode[]
  readonly options?: HierarchyLayoutOptions
}
