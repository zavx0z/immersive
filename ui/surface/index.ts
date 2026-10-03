/**
Область surface объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as Frame} from "@ui-surfaces/frame"
export type {UiSurfacesFrame} from "@ui-surfaces/frame"
export {default as Pane} from "@ui-surfaces/pane"
export type {PaneVariant, PaneTextContent, PaneProps} from "@ui-surfaces/pane"
export {default as Panel} from "@ui-surfaces/panel"
export type {PanelAction, PanelProps} from "@ui-surfaces/panel"
export {default as Tab} from "@ui-surfaces/tab"
export type {TabProps} from "@ui-surfaces/tab"
export {default as Window} from "@ui-surfaces/window"
export type {WindowProps, WindowGeometry, WindowAction} from "@ui-surfaces/window"
export * from "@ui-surfaces/chrome"
