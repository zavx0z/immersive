/**
SVG-значок minus в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconMinus as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const minusIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M5 12h14\"/>")

export default minusIcon

export type {Zavx0zImmersiveUiThemeIconMinus} from "./contract"
