/**
Область surface объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as Frame} from "@ui-surfaces/frame"
export type {UiSurfacesFrame} from "@ui-surfaces/frame"
export {default as Pane} from "@ui-surfaces/pane"
export type {UiSurfacesPane} from "@ui-surfaces/pane"
export {default as Panel} from "@ui-surfaces/panel"
export type {UiSurfacesPanel} from "@ui-surfaces/panel"
export {default as Tab} from "@ui-surfaces/tab"
export type {UiSurfacesTab} from "@ui-surfaces/tab"
export {default as Window} from "@ui-surfaces/window"
export type {UiSurfacesWindow} from "@ui-surfaces/window"
export * from "@ui-surfaces/chrome"
export {default as WindowControl} from "@ui-surfaces-window/control"
export type {UiSurfacesWindowControl} from "@ui-surfaces-window/control"
