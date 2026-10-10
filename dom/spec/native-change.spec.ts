/** Native поля остаются единственным состоянием при адресованном наблюдении. */
import {expect, test} from "bun:test"
import {createDocument, Element, observeConnection, defineDOMPropertyAttributes, notifyDOMPropertyChange, type Document} from "@zavx0z/immersive-dom"
import {nativePropertyForBinding, prepareDomOperation, propertyOperation} from "@zavx0z/immersive-dom/bindings"

test("actual input projections доставляются coalesced scope через существующую Document queue", () => {
  const document = createDocument(), input = document.createElement("input"), output = document.createElement("span")
  input.type = "number"
  let changes = 0
  const render = () => { output.textContent = String(input.valueAsNumber) }
  const scope = observeConnection(input, {properties: ["valueAsNumber"], changed() {
    changes++
    document.enqueueTask(render)
  }})
  document.transaction(() => {
    input.valueAsNumber = 1
    input.valueAsNumber = 2
  })
  expect(output.textContent).toBe("2")
  expect(changes).toBe(1)
  scope.suppressChanges(() => { input.valueAsNumber = 3 })
  expect(input.valueAsNumber).toBe(3)
  expect(changes).toBe(1)
  input.value = "4"
  expect(output.textContent).toBe("4")
  scope.dispose()
  input.valueAsNumber = 5
  expect(output.textContent).toBe("4")
})

test("binding eligibility доказывается реальной DOM операцией, а не существованием setter", () => {
  const document = createDocument(), input = document.createElement("input")
  expect(nativePropertyForBinding(input, "disabled")).toBe("disabled")
  expect(nativePropertyForBinding(input, "valueAsNumber")).toBeNull()
  const operation = prepareDomOperation(propertyOperation(input, "disabled", true))!
  operation.apply()
  expect(input.disabled).toBeTrue()
  operation.rollback()
  expect(input.disabled).toBeFalse()
})

test("native extension объявляет своё отражение и сообщает изменение собственного поля", () => {
  const document = createDocument()
  class Owner extends Element {
    constructor(owner: Document) { super(owner, "extension") }
    get size() { return Number(this.getAttribute("owner-size") ?? 0) }
    set size(value: number) { this.setAttribute("owner-size", String(value)) }
    token: object | null = null
  }
  defineDOMPropertyAttributes(Owner, {size: "owner-size"})
  const element = new Owner(document), token = {}
  let changed = 0
  const scope = observeConnection(element, {properties: ["size", "token"], changed() { changed++ }})
  document.transaction(() => {
    element.size = 42
    element.token = token
    notifyDOMPropertyChange(element, "token")
  })
  expect([element.size, element.token]).toEqual([42, token])
  expect(changed).toBe(1)
  scope.dispose()
})
