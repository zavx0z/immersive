/**
SVG-значок chevron-down в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconChevronDown as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const chevronDownIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m7 9 5 5 5-5\"/>")

export default chevronDownIcon

export type {ImmersiveUiThemeIconChevronDown} from "./contract"
