import {afterAll, describe, expect, test} from "bun:test"
import {validateSlotContracts} from "@jsx/slot-contract"
import {barrelSource, childSource, contractSource, createSlotContractFixture, receiverSource} from "./fixture/index.ts"

const fixture = await createSlotContractFixture({
  "children.tsx": childSource,
  "contract.ts": contractSource,
  "barrel.ts": barrelSource,
  "receiver.tsx": receiverSource,
  "alias.tsx": `
import {Panel} from "./receiver"
import {Button, IconButton} from "./children"
export function Application() {
  return <Panel>
    <Button slot="header" />
    <IconButton />
  </Panel>
}`,
  "conditional.tsx": `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application(props: {visible: boolean}) {
  return <Panel>
    <Button slot="header" />
    {[]}
    {props.visible ? <Button slot="footer" /> : null}
  </Panel>
}`,
  "union.tsx": `
import {Panel} from "./receiver"
import {Button, IconButton} from "./children"
export function Application(props: {visible: boolean}) {
  return <Panel>
    {props.visible ? <Button slot="header" /> : <IconButton slot="header" />}
    {[]}
  </Panel>
}`,
  "optional-array.tsx": `
import type {JSX} from "@jsx/types"
import type {Button} from "./children"
export function OptionalPanel(): JSX.Element<{default?: readonly typeof Button[]}> {
  return <slot />
}
export function Application() {return <OptionalPanel />}
`,
  "keyed.tsx": `
import {Panel} from "./receiver"
import {Button, IconButton} from "./children"
export function Application(props: {items: readonly string[]}) {
  return <Panel>
    <IconButton slot="header" />
    {props.items.map(id => <Button key={id} label={id} />)}
  </Panel>
}`,
  "forward.tsx": `
import type {JSX} from "@jsx/types"
import {Panel} from "./receiver"
import type {Button, IconButton} from "./children"
export function Forward(): JSX.Element<{header: typeof Button, default: readonly typeof IconButton[]}> {
  return <Panel>
    <slot name="header" slot="header" />
    <slot />
  </Panel>
}`,
  "unrestricted.tsx": `
import type {JSX} from "@jsx/types"
import {TwinButton} from "./children"
export function AnyPanel(): JSX.Element<{default: JSX.Element}> {
  return <slot />
}
export function Application() {
  return <AnyPanel><TwinButton /></AnyPanel>
}`,
  "text.tsx": `
import type {JSX} from "@jsx/types"
export function TextPanel(): JSX.Element<{default: string | number}> {
  return <slot />
}
export function Application() {
  return <TextPanel>{0}</TextPanel>
}`,
  "optional-text.tsx": `
import type {JSX} from "@jsx/types"
export function TextPanel(): JSX.Element<{default?: string}> {return <slot />}
export function Application(props: {text: string}) {return <TextPanel>{props.text}</TextPanel>}
`,
  "memo.tsx": `
import {memo} from "@zavx0z/component"
import {Panel} from "./receiver"
import {Button} from "./children"
const RememberedPanel = memo(Panel)
export function Application() {
  return <RememberedPanel>
    <Button slot="header" />
    {[]}
  </RememberedPanel>
}`,
  "untyped.tsx": `
export function PlainPanel() {return <slot />}
export function Ordinary() {return <button />}
export function Application(props: {unknown: any}) {
  return <>
    <PlainPanel>{props.unknown}</PlainPanel>
    <PlainPanel>{props.unknown}</PlainPanel>
  </>
}`,
})
afterAll(() => fixture.close())

describe.each([
  {name: "Alias и type-only re-export", props: {file: "alias.tsx"}, warning: false, typeDependencies: true},
  {name: "Необязательная одиночная область", props: {file: "conditional.tsx"}, warning: false, typeDependencies: true},
  {name: "Разрешённый union условных ветвей", props: {file: "union.tsx"}, warning: false, typeDependencies: true},
  {name: "Необязательная коллекция отсутствует", props: {file: "optional-array.tsx"}, warning: false, typeDependencies: false},
  {name: "Keyed коллекция", props: {file: "keyed.tsx"}, warning: false, typeDependencies: true},
  {name: "Типизированная передача слота", props: {file: "forward.tsx"}, warning: false, typeDependencies: true},
  {name: "Общий JSX.Element", props: {file: "unrestricted.tsx"}, warning: false, typeDependencies: false},
  {name: "Явный текстовый тип", props: {file: "text.tsx"}, warning: false, typeDependencies: false},
  {name: "Необязательный динамический текст", props: {file: "optional-text.tsx"}, warning: false, typeDependencies: false},
  {name: "Получатель memo", props: {file: "memo.tsx"}, warning: false, typeDependencies: true},
  {name: "Получатель без схемы", props: {file: "untyped.tsx"}, warning: true, typeDependencies: false},
])("$name", async ({props, warning, typeDependencies}) => {
  const input = await fixture.input(props.file)
  const result = await validateSlotContracts(input)

  test("Неблокирующие сообщения", () => {
    expect(result.diagnostics.map(diagnostic => ({code: diagnostic.code, component: diagnostic.component})),
      "Явная схема проверяется без предупреждений; нетипизированный получатель получает одно сообщение, обычный компонент без slot не требует схемы").toEqual(warning
      ? [{code: "JSX-SLOTS-UNTYPED", component: "PlainPanel"}]
      : [])
  })
  test("Исходник остаётся авторским", () => {
    expect(input.sourceFile.text, "Проверка не превращает type-only контракт в runtime metadata").toContain("export function")
  })
  /** @remarks Импортированный контракт нужен вариантам Panel; локальные схемы не имеют этих файлов. */
  describe.skipIf(!typeDependencies)("Зависимости типов", () => {
    test("Декларации и промежуточный re-export", () => {
      expect(result.dependencyPaths, "Изменение любого участника type-only цепочки требует повторной проверки компилятора").toEqual(expect.arrayContaining([
        `${fixture.directory}/barrel.ts`,
        `${fixture.directory}/contract.ts`,
        `${fixture.directory}/children.tsx`,
      ]))
    })
  })
})
