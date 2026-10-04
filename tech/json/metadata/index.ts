/**
Читатели JSON-метаданных модели имеют общий вход: источник и имя его поля.
Участники уточняют тип результата и правила резервного значения; исходные данные не изменяются.

@packageDocumentation
*/
export type {ImmersiveTechJsonMetadata} from "./contract"
export {default as metadata} from "@immersive-tech-json-metadata/read"
export type {ImmersiveTechJsonMetadataRead} from "@immersive-tech-json-metadata/read"
export {default as metadataString} from "@immersive-tech-json-metadata/string"
export type {ImmersiveTechJsonMetadataString} from "@immersive-tech-json-metadata/string"
export {default as metadataNumber} from "@immersive-tech-json-metadata/number"
export type {ImmersiveTechJsonMetadataNumber} from "@immersive-tech-json-metadata/number"
export {default as metadataBoolean} from "@immersive-tech-json-metadata/boolean"
export type {ImmersiveTechJsonMetadataBoolean} from "@immersive-tech-json-metadata/boolean"
export {default as metadataStringArray} from "@immersive-tech-json-metadata/string-array"
export type {ImmersiveTechJsonMetadataStringArray} from "@immersive-tech-json-metadata/string-array"
export {default as metadataObjectArray} from "@immersive-tech-json-metadata/object-array"
export type {ImmersiveTechJsonMetadataObjectArray} from "@immersive-tech-json-metadata/object-array"
