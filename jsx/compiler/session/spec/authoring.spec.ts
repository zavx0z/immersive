import {afterAll, beforeAll, expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"
import JsxCompileError from "@zavx0z/immersive-jsx-compiler-error"

const cases = [
  {
    name: "Компонент с children равным null",
    source: 'function Panel() { return <slot /> }\nexport function App() { return <Panel children={null} /> }',
    error: "between component tags",
  },
  {
    name: "Компонент с JSX в children",
    source: 'function Panel() { return <slot /> }\nfunction Child() { return <b /> }\nexport function App() { return <Panel children={<Child />} /> }',
    error: "between component tags",
  },
  {
    name: "Компонент с children через spread",
    source: 'function Panel() { return <slot /> }\nconst supplied = {children: null}\nexport function App() { return <Panel {...supplied} /> }',
    error: "component prop spreads are unsupported",
  },
  {
    name: "Назначение неизвестной области",
    source: 'function Panel() { return <slot name="header" /> }\nfunction Child() { return <b /> }\nexport function App() { return <Panel><Child slot="haeder" /></Panel> }',
    error: 'unknown slot "haeder"',
  },
  {
    name: "Повтор точки вставки",
    source: 'export function Panel() { return <section><slot name="header" /><slot name="header" /></section> }',
    error: 'Duplicate slot outlet "header"',
  },
  {
    name: "Динамическое имя точки вставки",
    source: 'export function Panel(props: {name: string}) { return <slot name={props.name} /> }',
    error: "статическое строковое имя",
  },
  {
    name: "Назначение вне получателя",
    source: 'function Child() { return <b /> }\nexport function App() { return <Child slot="header" /> }',
    error: "только внутри компонента",
  },
  {
    name: "Разные назначения условных ветвей",
    source: 'function Panel() { return <section><slot name="a" /><slot name="b" /></section> }\nfunction Child() { return <b /> }\nexport function App(props: {show: boolean}) { return <Panel>{props.show ? <Child slot="a" /> : <Child slot="b" />}</Panel> }',
    error: "одному статическому слоту",
  },
  {
    name: "Передача именованного слота получателю без слотов",
    source: 'import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"\nfunction Legacy(props: {children: JSX.Element}) { return <main>{props.children}</main> }\nexport function Forward() { return <Legacy><slot name="header" slot="header" /></Legacy> }',
    error: "только внутри компонента",
  },
]

let directory: string | undefined
let compiler: JsxCompilerSession | undefined

beforeAll(async () => {
  directory = await mkdtemp(join(resolve(import.meta.dir, "../test"), ".diagnostics-"))
  await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: "../../../../../tsconfig.json", include: ["*.tsx"]}))
  const paths: string[] = []
  for (const [index, entry] of cases.entries()) {
    const path = join(directory, `case-${index}.tsx`)
    paths.push(path)
    await Bun.write(path, entry.source)
  }
  const scenario = join(directory, "authoring.test.tsx")
  paths.push(scenario)
  await Bun.write(scenario, 'function Example() { return <slot children={null} /> }')
  compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [directory]})
  await compiler.prepareFiles(paths)
})

afterAll(async () => {
  try {
    await compiler?.close()
  } finally {
    if (directory) await rm(directory, {recursive: true, force: true})
  }
})

test.each(cases)("$name", async (entry) => {
  if (!compiler || !directory) throw new Error("Не подготовлен проект проверки авторства слотов")
  const path = join(directory, `case-${cases.indexOf(entry)}.tsx`)
  const actual = await compiler.compileFile(path).then(
    () => null,
    (error: unknown) => error,
  )
  expect(actual, "Непредставимая конструкция не подменяется другим исполняемым поведением").toBeInstanceOf(JsxCompileError)
  expect(actual instanceof Error ? actual.message : undefined, "Диагностика раскрывает конкретную причину отказа").toContain(entry.error)
})
