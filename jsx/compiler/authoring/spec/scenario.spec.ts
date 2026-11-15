/** Один AST имеет одну классификацию для кода и деклараций. */
import {describe, expect, test} from "bun:test"
import {API} from "typescript/unstable/async"
import {resolve} from "node:path"
import profile from "@zavx0z/immersive-jsx-compiler-authoring"

describe.each([{name: "Авторский модуль", props: {file: "fixture/components.tsx"}}])("$name", ({props}) => {
  test("Объявления", async () => {
    const path = resolve(import.meta.dir, props.file)
    const api = new API({cwd: resolve(import.meta.dir, "../../../..")})
    const snapshot = await api.updateSnapshot({openFiles: [path]})
    try {
      const project = await snapshot.getDefaultProjectForFile(path)
      const source = await project!.program.getSourceFile(path)
      const actual = profile(source!)
      expect(actual.components.map(value => value.name!.text), "JSX-компонент выделен из обычных функций").toEqual(["Example"])
      expect(actual.hooks.map(value => value.name!.text), "Hook определяется по авторскому имени").toEqual(["useExample"])
      expect(actual.authoringImports, "Исполняемый авторский импорт сохраняется").toEqual(["@zavx0z/immersive-component"])
    } finally {await snapshot.dispose(); await api.close()}
  })
})
