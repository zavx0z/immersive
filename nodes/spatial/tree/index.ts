/**
Призматическое дерево пространственных интерфейсов.

Вход — иерархия и содержимое сущностей. Компонент и контроллер владеют раскладкой,
полом, объёмами, Display, ограниченным видимым набором и навигацией ViewPoint
в одном существующем Experience. Знаний о приложении — источнике данных нет.

@packageDocumentation
*/
export {SpatialTree} from "./src/view.tsx"
export {createSpatialTreeController, createSpatialTreeState} from "./src/controller.ts"
export type {SpatialTreeNode} from "./contract/node.ts"
export type {SpatialTreeState, SpatialTreeSnapshot, SpatialTreeController, SpatialTreeControllerOptions} from "./contract/controller.ts"
