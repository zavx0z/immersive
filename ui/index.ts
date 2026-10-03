/**
Область ui объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as Badge} from "@ui/badge"
export type {UiBadge} from "@ui/badge"
export {default as CodeEditorModel} from "@ui/code-editor-model"
export type {CodeEditorRange, CodeEditorSnapshot, CodeEditorModelOptions, CodeEditorMovementUnit} from "@ui/code-editor-model"
export {default as Divider} from "@ui/divider"
export type {UiDivider} from "@ui/divider"
export {default as TerminalModel} from "@ui/terminal-model"
export type {TerminalRun, TerminalLine, TerminalSnapshot, TerminalQueryMode, TerminalModelOptions} from "@ui/terminal-model"
export {default as Typography} from "@ui/typography"
export type {UiTypography} from "@ui/typography"
export * from "@ui/buttons"
export * from "@ui/feedback"
export * from "@ui/fields"
export * from "@ui/menus"
export * from "@ui/navigation"
export * from "@ui/selection"
export * from "@ui/surfaces"
export * from "@ui/themes"
export * from "@ui/views"
export * from "@ui/widgets"
