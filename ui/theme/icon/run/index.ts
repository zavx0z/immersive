/**
SVG-значок run в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconRun as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const runIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M8 5v14l11-7-11-7Z\"/>")

export default runIcon

export type {ImmersiveUiThemeIconRun} from "./contract"
