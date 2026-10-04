/**
SVG-значок folder в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconFolder as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const folderIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M3 7h7l2 2h9v10H3z\"/><path d=\"M3 7V5h7l2 2\"/>")

export default folderIcon

export type {ImmersiveUiThemeIconFolder} from "./contract"
