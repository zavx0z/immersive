/**
Область feedback объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as Notification} from "@ui-feedback/notification"
export type {NotificationTone, NotificationProps} from "@ui-feedback/notification"
export {default as StatusBar} from "@ui-feedback/status-bar"
export type {StatusBarItem, StatusBarProps} from "@ui-feedback/status-bar"
