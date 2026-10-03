/**
SVG-значок chevron-right в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsChevronRight as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const chevronRightIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m10 7 5 5-5 5\"/>")

export default chevronRightIcon

export type {UiThemesIconsChevronRight} from "./contract"
