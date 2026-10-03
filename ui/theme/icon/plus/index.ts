/**
SVG-значок plus в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsPlus as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const plusIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M12 5v14\"/><path d=\"M5 12h14\"/>")

export default plusIcon

export type {UiThemesIconsPlus} from "./contract"
