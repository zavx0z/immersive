/**
SVG-значок collapse-all в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconCollapseAll as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const collapseAllIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M4 10h6V4\"/><path d=\"M20 14h-6v6\"/>", "#f3b6cf")

export default collapseAllIcon

export type {Zavx0zImmersiveUiThemeIconCollapseAll} from "./contract"
