/**
Неизменяемое описание одной синтаксической позиции JSX-слота.

@property @zavx0z/jsx/slot-child - Публичный discriminator общего транспорта.

@property name - Статическое имя области; пустая строка обозначает default.

@property content - Результат expression без монтирования и нормализации.

@property kind - Conditional сохраняет пустую позицию, keyed сохраняет границу списка.
*/
export interface SlotChildOutput {
  readonly "@zavx0z/jsx/slot-child": true
  readonly name: string
  readonly content: unknown
  readonly kind: "conditional" | "keyed"
}
