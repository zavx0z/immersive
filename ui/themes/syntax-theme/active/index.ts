/**
Активная синтаксическая тема интерфейса.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SyntaxColorTheme} from "./contract/types.ts"
import islandsDarkTheme from "@ui/themes/islands-dark.color-theme.json"

export type {SyntaxTokenColorRule, SyntaxColorTheme} from "./contract/types"

const activeSyntaxTheme = islandsDarkTheme as SyntaxColorTheme

export default activeSyntaxTheme
