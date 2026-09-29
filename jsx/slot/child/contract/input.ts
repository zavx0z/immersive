/**
Позиционные аргументы статического назначения одного JSX expression.
Имя определяется AST; content содержит уже вычисленный результат expression.
Содержимое проверяется принимающим runtime по kind, включая пустую коллекцию.
*/
export type SlotChildInput = readonly [
  name: string,
  content: unknown,
  kind: "conditional" | "keyed",
]
