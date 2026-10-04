/**
SVG-значок resource в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconResource as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const resourceIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M7 4H4v3\"/><path d=\"M17 4h3v3\"/><path d=\"M20 17v3h-3\"/><path d=\"M7 20H4v-3\"/><rect x=\"7\" y=\"7\" width=\"10\" height=\"10\" rx=\"1\"/>")

export default resourceIcon

export type {ImmersiveUiThemeIconResource} from "./contract"
