/**
Пространственная основа платформы: преобразования объектов, геометрия,
материалы, raycast, загрузка моделей, анимация и данные шрифтов.

ViewPoint принимает уже маршрутизированные команды orbit/pan/zoom.
Browser владеет Canvas, вводом и кадрами; конкретные ресурсы GPU и рисование
принадлежат `@zavx0z/immersive-webgpu`.

Система координат неизменна: правая, +X вправо, +Y вперёд, +Z вверх.
Единица расстояния — миллиметр, углы задаются в радианах, глубина clip space
лежит в [0, 1]. Камера не имеет настраиваемого up. glTF нормализуется
преобразованием импортированного дерева объектов.

@packageDocumentation
*/

export * from "./core/object-3d"
export * from "./core/presentation-clip"
export * from "./core/buffer-geometry"
export * from "./geometry/plane-geometry"
export * from "./geometry/textured-plane-geometry"
export * from "./geometry/sphere-geometry"
export * from "./geometry/torus-geometry"
export * from "./geometry/box-geometry"
export * from "./core/view-point"
export * from "./core/mesh"
export * from "./core/instanced-mesh"
export * from "./core/instance-layer"
export * from "./core/instanced-rounded-rect"
export * from "./core/instanced-stroked-path"
export * from "./core/wireframe-instanced-mesh"
export * from "./core/skinned-mesh"
export * from "./scene/space"
export * from "./loader/gltf-loader"
export * from "./material"
export * from "./material/glass-material"
export * from "./math"
export * from "./helpers/grid-helper"
export * from "./helpers/axes-helper"
export * from "./light/light"
export * from "./light/directional-light"
export * from "./text/true-type-font"
export * from "./object/line"
export * from "./object/line-segments"
export * from "./object/text"
export * from "./material/text-material"
export * from "./animation"
export * from "./core/raycaster"
