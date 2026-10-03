/**
SVG-значок close в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsClose as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const closeIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M6 6l12 12\"/><path d=\"M18 6 6 18\"/>")

export default closeIcon

export type {UiThemesIconsClose} from "./contract"
