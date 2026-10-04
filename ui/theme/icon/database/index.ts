/**
SVG-значок database в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconDatabase as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const databaseIcon: Contract.Output = /* @__PURE__ */ iconSvg("<ellipse cx=\"12\" cy=\"5\" rx=\"7\" ry=\"3\"/><path d=\"M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5\"/><path d=\"M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6\"/>")

export default databaseIcon

export type {Zavx0zImmersiveUiThemeIconDatabase} from "./contract"
