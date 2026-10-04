import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"

/** Чтение одного поля JSON-метаданных без изменения модели. */
export declare namespace Zavx0zImmersiveTechJsonMetadata {
  /** Источник и имя поля общие; дополнительные аргументы уточняет конкретный читатель. */
  type Input = readonly [value: Zavx0zImmersiveTechJsonValueOwn.Input[0] | undefined, key: string, ...options: readonly unknown[]]
}
