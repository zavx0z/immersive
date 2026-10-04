import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {planSlots, JsxCompilerSession, createJsxBunPlugin} from "@immersive/jsx"
import runtime from "@immersive-jsx-runtime/create"
import fragment from "@immersive-jsx-runtime/fragment"
import planner from "@immersive-jsx-slot/plan"
import compiler from "@immersive-jsx-compiler/session"
import adapter from "@immersive-jsx-compiler/bun"
import {Fragment as protocolFragment, jsx as protocolJsx, jsxs} from "@immersive/jsx/jsx-runtime"
import {Fragment as developmentFragment} from "@immersive/jsx/jsx-dev-runtime"

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
