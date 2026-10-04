/**
SVG-значок search в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconSearch as Contract} from "./contract"
import iconSvg from "@zavx0z/immersive-ui-theme-icon-compose"

const searchIcon: Contract.Output = /* @__PURE__ */ iconSvg("<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m15.5 15.5 5 5\"/>")

export default searchIcon

export type {Zavx0zImmersiveUiThemeIconSearch} from "./contract"
