import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"

/** Чтение одного поля JSON-метаданных без изменения модели. */
export declare namespace ImmersiveTechJsonMetadata {
  /** Источник и имя поля общие; дополнительные аргументы уточняет конкретный читатель. */
  type Input = readonly [value: ImmersiveTechJsonValueOwn.Input[0] | undefined, key: string, ...options: readonly unknown[]]
}
