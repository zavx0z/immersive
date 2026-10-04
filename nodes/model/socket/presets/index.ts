/**
Именованные цветовые и геометрические предустановки сокетов.

@packageDocumentation
*/
import type {ImmersiveNodesModelSocketPresets as Contract} from "./contract"
export type {ImmersiveNodesModelSocketPresets} from "./contract"

const SOCKET_PRESETS: Contract.Output = Object.freeze({
  boolean: preset("boolean", "Boolean", "#dc5485", "circle"),
  float: preset("float", "Float", "#9e9e9e", "circle"),
  integer: preset("integer", "Integer", "#5c9e6b", "circle"),
  vector: preset("vector", "Vector", "#638aeb", "circle"),
  rotation: preset("rotation", "Rotation", "#946be0", "diamond"),
  color: preset("color", "Color", "#ebc73d", "circle"),
  string: preset("string", "String", "#6bb8b8", "circle"),
  menu: preset("menu", "Menu", "#616b7a", "diamond"),
  object: preset("object", "Object", "#ed7d38", "circle"),
  collection: preset("collection", "Collection", "#e0e0e0", "square"),
  image: preset("image", "Image", "#946bd6", "circle"),
  material: preset("material", "Material", "#d4404d", "circle"),
  texture: preset("texture", "Texture", "#ba7033", "circle"),
  geometry: preset("geometry", "Geometry", "#38ad91", "diamond"),
  matrix: preset("matrix", "Matrix", "#5c91cc", "square"),
  shader: preset("shader", "Shader", "#54c763", "circle"),
  bundle: preset("bundle", "Bundle", "#2e9eae", "square-dot"),
  closure: preset("closure", "Closure", "#ab704a", "diamond-dot"),
  custom: preset("custom", "Custom", "#d659d1", "circle-dot"),
})


export default SOCKET_PRESETS

function preset(kind: keyof Contract.Output, label: string, color: string, shape: Contract.Output[keyof Contract.Output]["shape"]): Contract.Output[keyof Contract.Output] {
  return Object.freeze({kind, label, color, shape})
}
