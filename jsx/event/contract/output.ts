/**
Таблица авторских имён обработчиков и нативных DOM-событий.

Каждому ключу on… соответствует имя из HTMLElementEventMap.
Сам объект результата является таблицей.
*/
export interface EventNamesOutput {
  readonly [name: string]: keyof HTMLElementEventMap
}
