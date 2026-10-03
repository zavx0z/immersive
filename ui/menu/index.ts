/**
Меню и самостоятельные команды имеют общий JSX-протокол представления.
Menu принимает внешний набор действий, MenuItem представляет одну команду,
ClipboardMenu подключает команды существующего контроллера буфера обмена.
Группа не владеет нативным буфером, состоянием приложения или отдельным Document.

@packageDocumentation
*/
export type {UiMenus} from "./contract"
export {default as Menu} from "@ui-menus/menu"
export type {UiMenusMenu} from "@ui-menus/menu"
export {default as MenuItem} from "@ui-menus/menu-item"
export type {UiMenusMenuItem} from "@ui-menus/menu-item"
export {default as ClipboardMenu} from "@ui-menus/clipboard-menu"
export type {UiMenusClipboardMenu} from "@ui-menus/clipboard-menu"
