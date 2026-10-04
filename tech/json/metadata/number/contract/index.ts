import type {ImmersiveTechJsonMetadata} from "@immersive-tech-json/metadata/contract"

/** Читает конечное число, сохраняя ноль. */
export declare namespace ImmersiveTechJsonMetadataNumber {
  type Input = readonly [value: ImmersiveTechJsonMetadata.Input[0], key: ImmersiveTechJsonMetadata.Input[1]]
  type Output = number | undefined
}
