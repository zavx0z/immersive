/**
SVG-значок select-opened-item в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconSelectOpenedItem as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"


const selectOpenedItemIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M18 11a7 7 0 1 0-7 7\"/><path d=\"M15 11a4 4 0 1 0-4 4\"/><path d=\"M11 11v10l3-3 2.5 4 2-1-2.5-4 4-1Z\"/>")

export default selectOpenedItemIcon

export type {ImmersiveUiThemeIconSelectOpenedItem} from "./contract"
