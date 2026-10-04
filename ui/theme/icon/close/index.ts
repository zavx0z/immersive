/**
SVG-значок close в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconClose as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const closeIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M6 6l12 12\"/><path d=\"M18 6 6 18\"/>")

export default closeIcon

export type {Zavx0zImmersiveUiThemeIconClose} from "./contract"
