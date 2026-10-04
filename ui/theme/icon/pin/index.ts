/**
SVG-значок pin в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconPin as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const pinIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m9 3 6 6\"/><path d=\"m14 4 6 6\"/><path d=\"m7 10 7 7\"/><path d=\"m5 19 4-4\"/><path d=\"m8 11 7-7 5 5-7 7\"/>")

export default pinIcon

export type {Zavx0zImmersiveUiThemeIconPin} from "./contract"
