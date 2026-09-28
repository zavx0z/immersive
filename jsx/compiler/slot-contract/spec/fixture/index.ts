import {API} from "typescript/unstable/async"
import {mkdir, mkdtemp, rm} from "node:fs/promises"
import {resolve, join} from "node:path"
import type {ValidateSlotContractsInput} from "../../contract/input.ts"

/**
Общий native snapshot неизменяемых исходников одного прогона.

@property directory - Каноническая временная директория проекта, удаляемая при close.

@property input - Возвращает AST и project из одного snapshot по имени fixture-файла.

@property close - Освобождает native API, snapshot и принадлежащие fixture файлы.
*/
export type SlotContractFixture = Readonly<{
  directory: string
  input(name: string): Promise<ValidateSlotContractsInput>
  close(): Promise<void>
}>

/** Создаёт настоящий TypeScript-проект; fixture не вызывает описываемый валидатор. */
export async function createSlotContractFixture(sources: Readonly<Record<string, string>>): Promise<SlotContractFixture> {
  const root = resolve(import.meta.dir, "../../../../..")
  const fixtures = resolve(import.meta.dir, "../../.cache")
  await mkdir(fixtures, {recursive: true})
  const directory = await mkdtemp(join(fixtures, "native-"))
  const files = Object.keys(sources).map(name => join(directory, name))
  for (const [name, source] of Object.entries(sources)) await Bun.write(join(directory, name), source)
  await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({
    extends: join(root, "tsconfig.json"),
    include: ["*.ts", "*.tsx"],
    exclude: [],
  }))
  const api = new API({cwd: directory})
  try {
    const snapshot = await api.updateSnapshot({openFiles: files})
    return {
      directory,
      /** Загружает реальный AST, сохраняя владение project и checker текущим snapshot. */
      async input(name) {
        const path = join(directory, name)
        const project = await snapshot.getDefaultProjectForFile(path)
        if (!project) throw new Error(`Native fixture project not found: ${name}`)
        const sourceFile = await project.program.getSourceFile(path)
        if (!sourceFile) throw new Error(`Native fixture source not found: ${name}`)
        return {sourceFile, project}
      },
      /** Завершает один общий неизменяемый native snapshot после всех вариантов. */
      async close() {
        await snapshot.dispose()
        await api.close()
        await rm(directory, {recursive: true, force: true})
      },
    }
  } catch (error) {
    await api.close()
    await rm(directory, {recursive: true, force: true})
    throw error
  }
}

/** Type-only imports и обычные функции с совпадающими сигнатурами для проверки identity. */
export const childSource = `
import type {JSX} from "@jsx/types"

export function Button(props: {label?: string}): JSX.Element {
  return <button>{props.label}</button>
}

export function TwinButton(props: {label?: string}): JSX.Element {
  return <button>{props.label}</button>
}

export function IconButton(props: {label?: string}): JSX.Element {
  return <button>{props.label}</button>
}
`

/** Общая схема раскрывает наследование interface, union детей и alias результата. */
export const contractSource = `
import type {JSX} from "@jsx/types"
import type {Button, IconButton} from "./children"

export type Header = typeof Button | typeof IconButton
export interface HeaderSlots {header: Header}
export interface PanelSlots extends HeaderSlots {
  default: readonly (typeof Button | typeof IconButton)[]
  footer?: typeof Button
}
export type PanelResult = JSX.Element<PanelSlots>
`

/** Barrel является отдельной type-only зависимостью, несмотря на отсутствие runtime payload. */
export const barrelSource = `export type {PanelResult as Result} from "./contract"`

/** Получатель связывает точки вставки с импортированным типом результата, без children props. */
export const receiverSource = `
import type {Result} from "./barrel"

export function Panel(): Result {
  return <section>
    <slot name="header" />
    <slot />
    <slot name="footer" />
  </section>
}
`
