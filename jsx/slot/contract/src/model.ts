import type {FunctionDeclaration, SourceFile} from "typescript/unstable/ast"
import type {Project, Symbol as NativeSymbol} from "typescript/unstable/async"
import type {SlotContractDiagnostic} from "../contract/diagnostic.ts"

/** Разрешённые виды содержимого одной области; component atoms хранят native symbol identity. */
export type SlotField = Readonly<{
  name: string
  optional: boolean
  array: boolean
  atoms: ReadonlySet<string>
}>

/** Объявление получателя и разрешённая из его return annotation схема. */
export type Receiver = Readonly<{
  symbol: NativeSymbol
  declaration: FunctionDeclaration
  source: SourceFile
  outlets: readonly string[]
  schema: ReadonlyMap<string, SlotField> | null
}>

/** Доказанные возможные виды и границы количества содержимого до исполнения JSX. */
export type ContentProof = Readonly<{
  atoms: ReadonlySet<string>
  min: number
  max: number
  assigned: boolean
  unknown: boolean
}>

/** Кэши принадлежат одной проверке и не сохраняют native handles после snapshot. */
export type ValidationContext = {
  project: Project
  receivers: Map<number, Promise<Receiver | null>>
  diagnostics: Map<number, SlotContractDiagnostic>
  dependencyPaths: Set<string>
  identityNames: Map<string, string>
  identityTypes: Map<string, number>
}
