/**
Активная синтаксическая тема интерфейса.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeSyntaxActive as Contract} from "./contract"
import islandsDarkTheme from "@zavx0z/immersive-ui-component/theme/islands-dark.color-theme.json"

export type {ImmersiveUiThemeSyntaxActive} from "./contract"

const activeSyntaxTheme = islandsDarkTheme as Contract.Output

export default activeSyntaxTheme
