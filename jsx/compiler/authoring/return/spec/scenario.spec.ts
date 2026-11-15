/** Прямой JSX return сохраняет идентичность исходного AST. */
import {describe, expect, test} from "bun:test"
import {API} from "typescript/unstable/async"
import {resolve} from "node:path"
import {isFunctionDeclaration} from "typescript/unstable/ast/is"
import readReturn from "@zavx0z/immersive-jsx-compiler-authoring-return"

describe.each([{name: "Возврат компонента", props: {file: "fixture/components.tsx"}}])("$name", ({props}) => {
  test("Выбор return", async () => {
    const path = resolve(import.meta.dir, props.file)
    const api = new API({cwd: resolve(import.meta.dir, "../../../../..")})
    const snapshot = await api.updateSnapshot({openFiles: [path]})
    try {
      const project = await snapshot.getDefaultProjectForFile(path)
      const source = await project!.program.getSourceFile(path)
      const functions = source!.statements.filter(isFunctionDeclaration)
      expect(readReturn(functions[0]!), "Возврат JSX принадлежит исходному телу функции").toBe(functions[0]!.body!.statements[0])
      expect(readReturn(functions[1]!), "Обычный скалярный return не становится JSX").toBeNull()
    } finally {await snapshot.dispose(); await api.close()}
  })
})
