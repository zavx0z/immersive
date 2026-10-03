/** Рекурсивное переносимое JSON-значение; объекты имеют строковые ключи. */
export type JsonValue = null | boolean | number | string | readonly JsonValue[] | Readonly<{[key: string]: JsonValue}>
