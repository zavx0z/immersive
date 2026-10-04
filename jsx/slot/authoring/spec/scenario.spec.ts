import {afterAll, describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import {API} from "typescript/unstable/async"
import {isFunctionDeclaration} from "typescript/unstable/ast/is"
import SlotAuthoring from "@zavx0z/immersive-jsx-slot-authoring"

describe.each([
  {name: "Безымянная область", file: "default.tsx", expected: [""]},
  {name: "Именованная и безымянная области", file: "named.tsx", expected: ["header", ""]},
])("$name", async ({file, expected}) => {
  const path = resolve(import.meta.dir, "fixture", file)
  const api = new API({cwd: resolve(import.meta.dir, "../../../..")})
  const snapshot = await api.updateSnapshot({openFiles: [path]})
  afterAll(async () => { await snapshot.dispose()
    await api.close() })
  const project = await snapshot.getDefaultProjectForFile(path)
  const source = await project?.program.getSourceFile(path)
  if (!source) throw new Error(`Не прочитан AST ${path}`)
  const declaration = source.statements.find(isFunctionDeclaration)!
  const actual = new SlotAuthoring(source)
  actual.validate()
  const outlets = actual.outlets(declaration)

  test("Порядок точек вставки", () => {
    expect(outlets, "Имена читаются из JSX в исходном порядке; пустое имя обозначает default").toEqual(expected)
  })
  test("Подготовка без транспорта", () => {
    expect(actual.prepare(), "Проверка не исполняет и не переписывает исходник без запроса транспорта").toBe(source.text)
  })
})
