import {afterAll, expect, test} from "bun:test"
import validateSlotContracts from "@zavx0z/immersive-jsx-slot-contract"
import {barrelSource, childSource, contractSource, createSlotContractFixture, receiverSource} from "./fixture/index.ts"

const cases = [
  {name: "Одинаковая сигнатура другого объявления", code: "JSX-SLOTS-TYPE", detail: "TwinButton", source: `
import {Panel} from "./receiver"
import {Button, TwinButton} from "./children"
export function Application() {return <Panel><TwinButton slot="header" /><Button /></Panel>}
`},
  {name: "Отсутствующая обязательная одиночная область", code: "JSX-SLOTS-REQUIRED", detail: "header", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application() {return <Panel><Button /></Panel>}
`},
  {name: "Отсутствующая обязательная коллекция", code: "JSX-SLOTS-REQUIRED", detail: "default", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application() {return <Panel><Button slot="header" /></Panel>}
`},
  {name: "Несколько детей в одиночной области", code: "JSX-SLOTS-CARDINALITY", detail: "header", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application() {return <Panel><Button slot="header" /><Button slot="header" /><Button /></Panel>}
`},
  {name: "Отсутствующая условная обязательная область", code: "JSX-SLOTS-REQUIRED", detail: "header", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application(props: {visible: boolean}) {
  return <Panel>{props.visible ? <Button slot="header" /> : null}<Button /></Panel>
}
`},
  {name: "Map в одиночной области", code: "JSX-SLOTS-CARDINALITY", detail: "header", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application(props: {items: readonly string[]}) {
  return <Panel>{props.items.map(id => <Button key={id} slot="header" />)}<Button /></Panel>
}
`},
  {name: "Неизвестное динамическое содержимое", code: "JSX-SLOTS-UNPROVABLE", detail: "default", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application(props: {content: unknown}) {
  return <Panel><Button slot="header" />{props.content}</Panel>
}
`},
  {name: "Общий Element не доказывает identity", code: "JSX-SLOTS-UNPROVABLE", detail: "declaration identity", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Button} from "./children"
export function Single(): JSX.Element<{default: typeof Button}> {return <slot />}
export function Application(props: {content: JSX.Element}) {return <Single>{props.content}</Single>}
`},
  {name: "Контракт не соответствует точке вставки", code: "JSX-SLOTS-NAME", detail: "header", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Button} from "./children"
export function Incorrect(): JSX.Element<{header: typeof Button}> {return <slot name="footer" />}
`},
  {name: "Default и пустое имя конфликтуют", code: "JSX-SLOTS-NAME", detail: "default", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Button} from "./children"
export function Incorrect(): JSX.Element<{default: typeof Button, "": typeof Button}> {return <slot />}
`},
  {name: "Необъявленная область назначения", code: "JSX-SLOTS-NAME", detail: "toolbar", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application() {return <Panel><Button slot="toolbar" /><Button /></Panel>}
`},
  {name: "Чужой ребёнок в union коллекции", code: "JSX-SLOTS-TYPE", detail: "TwinButton", source: `
import {Panel} from "./receiver"
import {Button, TwinButton} from "./children"
export function Application() {return <Panel><Button slot="header" /><TwinButton /></Panel>}
`},
  {name: "Несовместимая типизированная передача", code: "JSX-SLOTS-TYPE", detail: "TwinButton", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import {Panel} from "./receiver"
import type {Button, TwinButton} from "./children"
export function Forward(): JSX.Element<{header: typeof TwinButton, default: readonly typeof Button[]}> {
  return <Panel><slot name="header" slot="header" /><slot /></Panel>
}
`},
  {name: "Нетипизированная передача в constrained область", code: "JSX-SLOTS-UNPROVABLE", detail: "default", source: `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Forward() {return <Panel><Button slot="header" /><slot /></Panel>}
`},
  {name: "Коллекция передаётся в одиночную область", code: "JSX-SLOTS-CARDINALITY", detail: "header", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import {Panel} from "./receiver"
import type {Button} from "./children"
export function Forward(): JSX.Element<{header: readonly typeof Button[], default: readonly typeof Button[]}> {
  return <Panel><slot name="header" slot="header" /><slot /></Panel>
}
`},
  {name: "Необязательная область передаётся в обязательную", code: "JSX-SLOTS-REQUIRED", detail: "header", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import {Panel} from "./receiver"
import type {Button} from "./children"
export function Forward(): JSX.Element<{header?: typeof Button, default: readonly typeof Button[]}> {
  return <Panel><slot name="header" slot="header" /><slot /></Panel>
}
`},
  {name: "Структурная function signature не является typeof", code: "JSX-SLOTS-CONTRACT", detail: "typeof", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
export function Incorrect(): JSX.Element<{default: () => JSX.Element}> {return <slot />}
`},
  {name: "Primitive не преобразуется к объявленному типу", code: "JSX-SLOTS-TYPE", detail: "number", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
export function Text(): JSX.Element<{default: string}> {return <slot />}
export function Application() {return <Text>{0}</Text>}
`},
  {name: "Literal primitive не расширяется молча", code: "JSX-SLOTS-CONTRACT", detail: "literal", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
export function Text(): JSX.Element<{default: "yes"}> {return <slot />}
export function Application() {return <Text>{"no"}</Text>}
`},
  {name: "Динамическая строка не доказывает непустоту обязательного слота", code: "JSX-SLOTS-REQUIRED", detail: "default", source: `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
export function Text(): JSX.Element<{default: string}> {return <slot />}
export function Application(props: {text: string}) {return <Text>{props.text}</Text>}
`},
] as const

const fixture = await createSlotContractFixture({
  "children.tsx": childSource,
  "contract.ts": contractSource,
  "barrel.ts": barrelSource,
  "receiver.tsx": receiverSource,
  ...Object.fromEntries(cases.map((item, index) => [`invalid-${index}.tsx`, item.source])),
})
afterAll(() => fixture.close())

test.each(cases.map((item, index) => ({...item, file: `invalid-${index}.tsx`})))("$name", async ({file, code, detail}) => {
  const input = await fixture.input(file)
  let failure: unknown
  try {
    await validateSlotContracts(input)
  } catch (error) {
    failure = error
  }
  expect(failure, "Неподдерживаемое назначение должно завершиться типизированным отказом").toBeInstanceOf(Error)
  expect(failure, "Причина и исходная позиция доступны без разбора generated кода").toMatchObject({
    code,
    sourcePath: input.sourceFile.fileName,
    line: expect.any(Number),
    column: expect.any(Number),
  })
  expect((failure as Error).message, "Диагностика объясняет конфликт назначения и ожидаемого контракта").toContain(detail)
})
