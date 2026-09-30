/**
Область widget объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as Editor} from "@ui-widgets/editor"
export type {EditorProps} from "@ui-widgets/editor"
export {default as Inspector} from "@ui-widgets/inspector"
export type {InspectorCategory, InspectorAction, InspectorContextRow, InspectorContext, InspectorProps} from "@ui-widgets/inspector"
export {default as Terminal} from "@ui-widgets/terminal"
export type {TerminalTextPosition, TerminalSelectionSnapshot, TerminalHandle, TerminalProps} from "@ui-widgets/terminal"
export {default as Tree} from "@ui-widgets/tree"
export type {TreeItem, TreeHandle, TreeProps} from "@ui-widgets/tree"
export {default as WidgetHeader} from "@ui-widgets/header"
export type {WidgetAction, WidgetHeaderProps} from "@ui-widgets/header"
