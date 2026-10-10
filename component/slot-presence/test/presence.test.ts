import {expect, test} from "bun:test"
import {createDocument, createDomRoot} from "@zavx0z/immersive-dom"
import {hasSlot} from "@zavx0z/immersive-component/authoring"
import {components} from "../../tests/fixture.ts"

test("presence читает next content и не принимает fallback за назначенное содержимое", () => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createDomRoot(host)
  try {
    root.render(components.Presence, {})
    const article = host.firstElementChild
    expect(host.textContent).toBe('{"body":false,"header":false}fallback')
    root.render(components.Presence, {}, {content: {"": [0], header: ["заголовок"]}})
    expect(host.firstElementChild).toBe(article)
    expect(host.textContent).toBe('{"body":true,"header":true}0заголовок')
    root.render(components.Presence, {}, {content: {"": [null, false, "", []], header: []}})
    expect(host.textContent).toBe('{"body":false,"header":false}fallback')
    expect(() => root.render(components.Presence, {selected: "missing"})).toThrow("Unknown slot missing")
    expect(host.textContent).toBe('{"body":false,"header":false}fallback')
  } finally { root.unmount() }
})

test("presence — compile-only API; неверное имя отвергается concrete compiled code", () => {
  expect(() => hasSlot()).toThrow("authoring API")
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createDomRoot(host)
  try { expect(() => root.render(components.Presence, {selected: 1})).toThrow("Slot name must be a string") }
  finally { root.unmount() }
})
