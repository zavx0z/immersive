/** Правила авторства проверяются явно в сценарии, отдельно от подготовки транспорта. */
import {afterAll, describe, expect, test} from "bun:test"
import {mkdir, mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {API} from "typescript/unstable/async"
import SlotAuthoring from "@jsx-slot/authoring"

const cases = [
  {name: "Пустой children у slot", source: 'export function Panel() { return <slot children={null} /> }', error: "атрибут children запрещён"},
  {name: "JSX в children у slot", source: 'export function Panel() { return <slot children={<b />} /> }', error: "атрибут children запрещён"},
  {name: "Spread у slot", source: 'const supplied = {children: null}\nexport function Panel() { return <slot {...supplied} /> }', error: "spread запрещён"},
  {name: "Стиль slot", source: 'export function Panel() { return <slot style={css`color: red;`} /> }', error: "не поддерживается у slot"},
  {name: "Children компонента", source: 'function Panel() { return <slot /> }\nexport function App() { return <Panel children={null} /> }', error: "between component tags"},
  {name: "Spread компонента", source: 'function Panel() { return <slot /> }\nconst supplied = {children: null}\nexport function App() { return <Panel {...supplied} /> }', error: "component prop spreads are unsupported"},
  {name: "Динамическое имя", source: 'export function Panel(props: {name: string}) { return <slot name={props.name} /> }', error: "статическое строковое имя"},
  {name: "Динамическое назначение", source: 'function Child() { return <b /> }\nexport function App(props: {name: string}) { return <Child slot={props.name} /> }', error: "статическое строковое имя"},
]

const root = resolve(import.meta.dir, "../../../..")
const cache = resolve(import.meta.dir, "../.cache")
await mkdir(cache, {recursive: true})
const directory = await mkdtemp(join(cache, "authoring-"))
await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: join(root, "tsconfig.json"), include: ["*.tsx"]}))
const paths = cases.map((entry, index) => join(directory, `${index}.tsx`))
await Promise.all(cases.map((entry, index) => Bun.write(paths[index]!, entry.source)))
const api = new API({cwd: root})
const snapshot = await api.updateSnapshot({openFiles: paths})
afterAll(async () => {
  await snapshot.dispose()
  await api.close()
  await rm(directory, {recursive: true, force: true})
})

describe.each(cases.map((entry, index) => ({name: entry.name, props: {path: paths[index]!}, error: entry.error})))
("$name", async ({props, error}) => {
  const project = await snapshot.getDefaultProjectForFile(props.path)
  const source = await project?.program.getSourceFile(props.path)
  if (!source) throw new Error(`Не прочитан исходник ${props.path}`)
  const authoring = new SlotAuthoring(source)

  test("Правило авторства", () => {
    expect(() => authoring.validate(), "Сценарий отклоняет нарушение с конкретной причиной").toThrow(error)
  })
  test("Подготовка не повторяет проверку", () => {
    expect(authoring.prepare(), "Без запроса транспорта подготовка возвращает исходный текст и не запускает валидацию")
      .toBe(source.text)
  })
})
