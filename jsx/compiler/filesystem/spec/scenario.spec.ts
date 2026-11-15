/** Настройки компиляции применяются только к читаемому представлению. */
import {describe, expect, test} from "bun:test"
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"
import filesystem from "@zavx0z/immersive-jsx-compiler-filesystem"

describe.each([{name: "Готовые зависимости", props: {conditions: [] as string[]}}])("$name", ({props}) => {
  test("Изоляция настроек", async () => {
    const directory = await mkdtemp(join(tmpdir(), "compiler-filesystem-"))
    const config = join(directory, "tsconfig.json")
    const source = join(directory, "entry.ts")
    const original = '{"compilerOptions":{"customConditions":["source"]},"include":["**/*.ts"]}'
    try {
      await writeFile(config, original)
      const fs = filesystem(props.conditions, [source], new Map([[source, "export const value = 1"]]))!
      const result = JSON.parse(String(await fs.readFile!(config)))
      expect(result.compilerOptions.customConditions, "Выбранная компиляция использует свои условия exports").toEqual([])
      expect(result.files, "Корни ограничены переданными исходниками").toEqual([source])
      expect(await fs.readFile!(source), "Изменённый текст принадлежит одному представлению").toBe("export const value = 1")
      expect(await readFile(config, "utf8"), "Физическая конфигурация проекта сохранена").toBe(original)
      expect(filesystem(undefined), "Без настроек используется штатная файловая система").toBeUndefined()
    } finally {await rm(directory, {recursive: true, force: true})}
  })
})
