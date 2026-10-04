import {expect, test} from "bun:test"
import {join} from "node:path"
import validateSlotContracts from "@zavx0z/immersive-jsx-slot-contract"
import {barrelSource, childSource, contractSource, createSlotContractFixture, receiverSource} from "./fixture/index.ts"

test("новая версия type-only контракта повторно проверяется сценарием без компиляции", async () => {
  const fixture = await createSlotContractFixture({
    "children.tsx": childSource,
    "contract.ts": contractSource,
    "barrel.ts": barrelSource,
    "receiver.tsx": receiverSource,
    "application.tsx": `
import {Panel} from "./receiver"
import {Button} from "./children"
export function Application() {
  return <Panel>
    <Button slot="header" />
    <Button />
  </Panel>
}
`,
  })
  try {
    const first = await validateSlotContracts(await fixture.input("application.tsx"))
    expect(first.diagnostics, "Исходная композиция соответствует схеме").toEqual([])
    expect(first.dependencyPaths, "Результат проверки включает type-only зависимость")
      .toContain(join(fixture.directory, "contract.ts"))
    await Bun.write(join(fixture.directory, "contract.ts"), contractSource.replaceAll("typeof Button | typeof IconButton", "typeof IconButton"))
    await fixture.refresh()
    let failure: unknown
    try {
      await validateSlotContracts(await fixture.input("application.tsx"))
    } catch (error) {
      failure = error
    }
    expect(failure, "Изменившийся контракт отклоняет прежнее содержимое")
      .toMatchObject({code: "JSX-SLOTS-TYPE"})
  } finally {
    await fixture.close()
  }
}, 30_000)
