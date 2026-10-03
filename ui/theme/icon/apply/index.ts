/**
SVG-значок apply в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsApply as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const applyIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m5 13 4 4L19 7\"/>")

export default applyIcon

export type {UiThemesIconsApply} from "./contract"
