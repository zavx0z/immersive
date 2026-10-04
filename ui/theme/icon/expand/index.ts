/**
SVG-значок expand в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconExpand as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const expandIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M8 3H3v5\"/><path d=\"M16 3h5v5\"/><path d=\"M21 16v5h-5\"/><path d=\"M3 16v5h5\"/><path d=\"M3 3l6 6\"/><path d=\"M21 3l-6 6\"/><path d=\"M21 21l-6-6\"/><path d=\"M3 21l6-6\"/>")

export default expandIcon

export type {ImmersiveUiThemeIconExpand} from "./contract"
