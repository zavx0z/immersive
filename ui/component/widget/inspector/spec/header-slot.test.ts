import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {createRoot} from "@zavx0z/immersive-component"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import NamedHeaderFixture from "./fixture/named-header"
import Inspector from "../index"

function fixture() {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  return {host, root: createRoot(host)}
}

test("именованная шапка замещает поиск и сохраняет default содержимое в том же Inspector", () => {
  const f = fixture()
  try {
    f.root.render(NamedHeaderFixture as unknown as CompiledTemplate<{show: boolean}>, {show: true})
    f.root.flush()
    expect(f.host.querySelectorAll("aside")).toHaveLength(1)
    expect(f.host.querySelector("[data-custom-inspector-header]")?.textContent).toBe("Имя выбранного предмета")
    expect(f.host.querySelector('input[type="search"]')).toBeNull()
    expect(f.host.querySelector("[data-inspector-panels] [data-custom-inspector-content]")?.textContent).toBe("Содержимое")
    const original = f.host.querySelector("aside")
    f.root.render(NamedHeaderFixture as unknown as CompiledTemplate<{show: boolean}>, {show: false})
    f.root.flush()
    expect(f.host.querySelector("aside")).toBe(original)
    expect(f.host.querySelector("[data-custom-inspector-header]")).toBeNull()
    expect(f.host.querySelector('input[type="search"]')).not.toBeNull()
  } finally {f.root.unmount()}
})

test("без именованной шапки остаётся штатный поиск", () => {
  const f = fixture()
  try {
    const props = {categories: [], selectedCategoryId: "", query: "Текст"}
    f.root.render(Inspector as unknown as CompiledTemplate<typeof props>, props)
    f.root.flush()
    expect(f.host.querySelector('input[type="search"]')).not.toBeNull()
  } finally {f.root.unmount()}
})
