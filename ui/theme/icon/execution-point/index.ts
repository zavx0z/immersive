/**
SVG-значок execution-point в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconExecutionPoint as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const executionPointIcon: Contract.Output = /* @__PURE__ */ iconSvg("<path d=\"M12 3v4\"/><path d=\"M12 17v4\"/><path d=\"M3 12h4\"/><path d=\"M17 12h4\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>")

export default executionPointIcon

export type {ImmersiveUiThemeIconExecutionPoint} from "./contract"
