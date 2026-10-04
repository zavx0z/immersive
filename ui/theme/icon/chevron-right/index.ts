/**
SVG-значок chevron-right в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconChevronRight as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const chevronRightIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m10 7 5 5-5 5\"/>")

export default chevronRightIcon

export type {Zavx0zImmersiveUiThemeIconChevronRight} from "./contract"
