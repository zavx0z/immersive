/**
SVG-значок arrow-up в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconArrowUp as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const arrowUpIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M12 19V5\"/><path d=\"m7 10 5-5 5 5\"/>")

export default arrowUpIcon

export type {ImmersiveUiThemeIconArrowUp} from "./contract"
