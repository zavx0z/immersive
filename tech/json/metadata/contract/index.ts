import type {NodeValuesOwn} from "@node-values/own"

/** Чтение одного поля JSON-метаданных без изменения модели. */
export declare namespace NodesMetadata {
  /** Источник и имя поля общие; дополнительные аргументы уточняет конкретный читатель. */
  type Input = readonly [value: NodeValuesOwn.Input[0] | undefined, key: string, ...options: readonly unknown[]]
}
