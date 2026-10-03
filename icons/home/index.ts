/**
SVG-значок home в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsHome as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const homeIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m3 10 9-7 9 7v10H3Z\"/><path d=\"M9 20v-7h6v7\"/>")

export default homeIcon

export type {UiThemesIconsHome} from "./contract"
