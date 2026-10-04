/**
SVG-значок arrow-down в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconArrowDown as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const arrowDownIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M12 5v14\"/><path d=\"m7 14 5 5 5-5\"/>")

export default arrowDownIcon

export type {Zavx0zImmersiveUiThemeIconArrowDown} from "./contract"
