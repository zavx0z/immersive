/** Одни адресованные операции применимы к существующим DOM-объектам без author runtime. */
import {expect, test} from "bun:test"
import {createDocument, DOMGroup, Event} from "@zavx0z/immersive-dom"
import {DomEventBinding, prepareDomOperation, propertyOperation, snapshotDomNodes, styleOperation} from "@zavx0z/immersive-dom/bindings"

test("подготовленная запись native value и CSS допускает apply/rollback на том же Element", () => {
  const document = createDocument(), input = document.createElement("input")
  input.value = "initial"
  const value = prepareDomOperation(propertyOperation(input, "value", "next"))!
  const style = prepareDomOperation(styleOperation(input, ["color: red", false, "width: 4px"]))!
  value.apply()
  style.apply()
  expect(input.value).toBe("next")
  expect(input.getAttribute("style")).toBe("color: red; width: 4px")
  style.rollback()
  value.rollback()
  expect(input.value).toBe("initial")
  expect(input.getAttribute("style")).toBeNull()
})

test("binding заменяет listener, а снимок Group сохраняет его реальные границы", () => {
  const document = createDocument(), button = document.createElement("button")
  const group = new DOMGroup(document, button)
  expect(snapshotDomNodes(group)).toEqual(group.insertionNodes)
  const events: string[] = []
  const binding = new DomEventBinding(button, "click")
  binding.prepare(() => { events.push("first") })!.apply()
  button.dispatchEvent(new Event("click"))
  binding.prepare(() => { events.push("second") })!.apply()
  button.dispatchEvent(new Event("click"))
  binding.dispose()
  button.dispatchEvent(new Event("click"))
  expect(events).toEqual(["first", "second"])
})
