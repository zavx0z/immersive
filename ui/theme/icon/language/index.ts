/**
SVG-значок language в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconLanguage as Contract} from "./contract"
import iconSvg from "@immersive-ui-theme-icon/compose"

const languageIcon: Contract.Output = /* @__PURE__ */ iconSvg("<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18\"/><path d=\"M12 3a14 14 0 0 1 0 18\"/><path d=\"M12 3a14 14 0 0 0 0 18\"/>")

export default languageIcon

export type {ImmersiveUiThemeIconLanguage} from "./contract"
