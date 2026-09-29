import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {planSlots, JsxCompilerSession, createJsxBunPlugin} from "@zavx0z/jsx"
import runtime from "@jsx-runtime/create"
import fragment from "@jsx-runtime/fragment"
import planner from "@jsx-slot/plan"
import compiler from "@jsx-compiler/session"
import adapter from "@jsx-compiler/bun"
import {Fragment as protocolFragment, jsx as protocolJsx, jsxs} from "@zavx0z/jsx/jsx-runtime"
import {Fragment as developmentFragment} from "@zavx0z/jsx/jsx-dev-runtime"

test("домен назначает имена, сохраняя identity компонентов и обоих протоколов", () => {
  expect(planSlots).toBe(planner)
  expect(JsxCompilerSession).toBe(compiler)
  expect(createJsxBunPlugin).toBe(adapter)
  expect(protocolFragment).toBe(fragment)
  expect(developmentFragment).toBe(fragment)
  expect(protocolJsx).toBe(runtime)
  expect(jsxs).toBe(runtime)
})

test("native runtime для браузера исключает серверный API JSX", async () => {
  const result = await Bun.build({
    entrypoints: [resolve(import.meta.dir, "browser.fixture.ts")],
    target: "browser",
    metafile: true,
  })
  expect(result.success).toBeTrue()
  const code = await result.outputs[0]!.text()
  expect(code).not.toContain("JsxCompilerSession")
  expect(code).not.toContain("createJsxBunPlugin")
  const inputs = Object.keys(result.metafile!.inputs)
  expect(inputs.filter(path => /jsx\/(compiler|bun|authoring)\//u.test(path))).toEqual([])
  expect(inputs.filter(path => /typescript/u.test(path))).toEqual([])
})
