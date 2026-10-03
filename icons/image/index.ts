/**
SVG-значок image в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsImage as Contract} from "./contract"
import iconSvg from "@ui-themes-icons/compose"

const imageIcon: Contract.Output = /* @__PURE__ */ iconSvg("<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><circle cx=\"8.5\" cy=\"10\" r=\"1.5\"/><path d=\"M21 16l-5.2-5.2a1.6 1.6 0 0 0-2.2 0L5 19\"/>", "#5cf0ff")

export default imageIcon

export type {UiThemesIconsImage} from "./contract"
