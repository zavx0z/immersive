/**
SVG-значок breakpoint в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsBreakpoint as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const breakpointIcon: Contract.Output = /* @__PURE__ */ iconSvg("<circle cx=\"12\" cy=\"12\" r=\"6\"/><path d=\"M12 6v12\"/><path d=\"M6 12h12\"/>")

export default breakpointIcon

export type {UiThemesIconsBreakpoint} from "./contract"
