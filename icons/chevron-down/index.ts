/**
SVG-значок chevron-down в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsChevronDown as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const chevronDownIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m7 9 5 5 5-5\"/>")

export default chevronDownIcon

export type {UiThemesIconsChevronDown} from "./contract"
