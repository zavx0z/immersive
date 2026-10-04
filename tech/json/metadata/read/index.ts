/**
Читает собственное поле JSON-объекта.

@packageDocumentation
*/
import type {Zavx0zImmersiveTechJsonMetadataRead as Contract} from "./contract"
export type {Zavx0zImmersiveTechJsonMetadataRead} from "./contract"
type NodeJsonObject = Extract<Contract.Input[0], Readonly<Record<string, Contract.Input[0]>>>

export default function metadata(value: Contract.Input[0], key: Contract.Input[1]): Contract.Output {
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) return undefined
  return Object.hasOwn(value, key) ? (value as NodeJsonObject)[key] : undefined
}
