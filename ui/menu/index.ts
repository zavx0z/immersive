/**
Область menu объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as ClipboardMenu} from "@ui-menus/clipboard-menu"
export type {ClipboardMenuController} from "@ui-menus/clipboard-menu"
export {default as Menu} from "@ui-menus/menu"
export type {MenuAction, MenuProps} from "@ui-menus/menu"
export {default as MenuItem} from "@ui-menus/menu-item"
export type {MenuItemProps} from "@ui-menus/menu-item"
