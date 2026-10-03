/**
Перечень поддерживаемых видов сокета.

@packageDocumentation
*/
import type {SocketValuesKinds as Contract} from "./contract"
export type {SocketValuesKinds} from "./contract"

const SOCKET_KINDS: Contract.Output = Object.freeze([
  "boolean",
  "float",
  "integer",
  "vector",
  "rotation",
  "color",
  "string",
  "menu",
  "object",
  "collection",
  "image",
  "material",
  "texture",
  "geometry",
  "matrix",
  "shader",
  "bundle",
  "closure",
  "custom",
] as const)

export default SOCKET_KINDS
