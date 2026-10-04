/**
SVG-значок visibility-on в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconVisibilityOn as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const visibilityOnIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z\"/><circle cx=\"12\" cy=\"12\" r=\"2.5\"/>")

export default visibilityOnIcon

export type {ImmersiveUiThemeIconVisibilityOn} from "./contract"
