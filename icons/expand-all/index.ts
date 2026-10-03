/**
SVG-значок expand-all в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsExpandAll as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const expandAllIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M10 4H4v6\"/><path d=\"M14 20h6v-6\"/>", "#f3b6cf")

export default expandAllIcon

export type {UiThemesIconsExpandAll} from "./contract"
