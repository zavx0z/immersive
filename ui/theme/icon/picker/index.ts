/**
SVG-значок picker в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconPicker as Contract} from "./contract"
import iconSvg from "@immersive-ui-theme-icon/compose"

const pickerIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"m19 3 2 2-10.5 10.5-3.5 1 1-3.5Z\"/><path d=\"m15.5 6.5 2 2\"/><path d=\"M5 19h5\"/>")

export default pickerIcon

export type {ImmersiveUiThemeIconPicker} from "./contract"
