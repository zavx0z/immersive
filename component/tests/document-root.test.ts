import {expect, test} from "bun:test"
import {createDocument, createDomRoot} from "@zavx0z/immersive-dom"
import {components} from "./fixture.ts"

test("Document root использует один actual Element и освобождает ownership", () => {
  const document = createDocument()
  const root = createDomRoot(document)
  root.render(components.NativeInput, {value: "first"})
  const input = document.documentElement!
  root.render(components.NativeInput, {value: "next"})
  expect(document.documentElement).toBe(input)
  expect(input.ownerDocument).toBe(document)
  expect(() => createDomRoot(document)).toThrow()
  root.unmount()
  expect(document.documentElement).toBeNull()
  createDomRoot(document).unmount()
})

test("Document root не принимает два Element и сохраняет предыдущее дерево", () => {
  const document = createDocument()
  const root = createDomRoot(document)
  root.render(components.Plain, {value: "accepted"})
  const previous = document.documentElement
  expect(() => root.render(components.Pair, {value: "rejected"})).toThrow()
  expect(document.documentElement).toBe(previous)
  expect(previous!.textContent).toBe("accepted")
  root.unmount()
})
