/**
Область themes/syntax-theme объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as activeSyntaxTheme} from "@ui-themes-syntax-theme/active"
export type {SyntaxTokenColorRule, SyntaxColorTheme} from "@ui-themes-syntax-theme/active"
export {default as activeSyntaxThemeName} from "@ui-themes-syntax-theme/name"
export {default as resolveSyntaxScopeColorHex} from "@ui-themes-syntax-theme/resolve"
