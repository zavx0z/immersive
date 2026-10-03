/**
Читатели JSON-метаданных модели имеют общий вход: источник и имя его поля.
Участники уточняют тип результата и правила резервного значения; исходные данные не изменяются.

@packageDocumentation
*/
export type {NodesMetadata} from "./contract"
export {default as metadata} from "@node-metadata/read"
export type {NodeMetadataRead} from "@node-metadata/read"
export {default as metadataString} from "@node-metadata/string"
export type {NodeMetadataString} from "@node-metadata/string"
export {default as metadataNumber} from "@node-metadata/number"
export type {NodeMetadataNumber} from "@node-metadata/number"
export {default as metadataBoolean} from "@node-metadata/boolean"
export type {NodeMetadataBoolean} from "@node-metadata/boolean"
export {default as metadataStringArray} from "@node-metadata/string-array"
export type {NodeMetadataStringArray} from "@node-metadata/string-array"
export {default as metadataObjectArray} from "@node-metadata/object-array"
export type {NodeMetadataObjectArray} from "@node-metadata/object-array"
