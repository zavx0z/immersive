/**
Активная синтаксическая тема интерфейса.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesSyntaxThemeActive as Contract} from "./contract"
import islandsDarkTheme from "@zavx0z/ui/theme/islands-dark.color-theme.json"

export type {UiThemesSyntaxThemeActive} from "./contract"

const activeSyntaxTheme = islandsDarkTheme as Contract.Output

export default activeSyntaxTheme
