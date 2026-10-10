/** Публичный DOMRoot владеет фактическим результатом и сохраняет его место. */
import {expect, test} from "bun:test"
import {createDocument, domComponentConstructorBrand, DOMGroup, HTMLButtonElement, type Document, type DOMComponentContent} from "@zavx0z/immersive-dom"
import {createDomRoot} from "@zavx0z/immersive-dom/root"

class Button extends HTMLButtonElement {
  static readonly [domComponentConstructorBrand] = true as const
  props: Readonly<{label: string}>
  content: DOMComponentContent = {}
  constructor(document: Document, props: Readonly<{label: string}>) {
    super(document)
    this.props = props
    this.update(props)
  }
  update(props: Readonly<{label: string}>) {
    this.props = props
    this.textContent = props.label
  }
  dispose() { this.remove() }
}

test("current — фактический объект; обновление и замена следуют за переносом в projection", () => {
  const document = createDocument(), staging = document.createDocumentFragment()
  const projection = document.createElement("main"), sibling = document.createElement("aside")
  projection.append(sibling)
  document.append(projection)
  const root = createDomRoot(staging)
  expect(root.current).toBeNull()
  root.render(Button, {label: "first"})
  const button = root.current as Button
  root.moveTo(projection, sibling)
  button.focus()
  root.render(Button, {label: "updated"})
  expect(root.current === button).toBeTrue()
  expect(projection.childNodes).toEqual([button, sibling])
  expect(button.textContent).toBe("updated")
  expect(document.activeElement === button).toBeTrue()
  root.render(Button, {label: "replacement"}, {key: "new"})
  expect(root.current === button).toBeFalse()
  expect(projection.firstChild === root.current).toBeTrue()
  expect(projection.lastChild === sibling).toBeTrue()
  expect(projection.childNodes).toHaveLength(2)
  expect(staging.childNodes).toHaveLength(0)
  root.unmount()
  expect(root.current).toBeNull()
  expect(projection.childNodes).toEqual([sibling])
})

test("контейнер имеет одного живого владельца; полный Group переносится обычным DOM", () => {
  const document = createDocument(), staging = document.createDocumentFragment(), projection = document.createElement("main")
  class Pair extends DOMGroup {
    static readonly [domComponentConstructorBrand] = true as const
    props: Readonly<{label: string}>
    content: DOMComponentContent = {}
    constructor(owner: Document, props: Readonly<{label: string}>) {
      super(owner, owner.createElement("button"), owner.createElement("input"))
      this.props = props
    }
    update(props: Readonly<{label: string}>) { this.props = props }
    dispose() { this.remove() }
  }
  const root = createDomRoot(staging)
  expect(() => createDomRoot(staging)).toThrow("live DOM root")
  const independent = createDomRoot(projection)
  root.render(Pair, {label: "pair"})
  const pair = root.current as Pair
  const nodes = [...staging.childNodes]
  projection.append(pair)
  root.render(Pair, {label: "updated"})
  expect(root.current === pair).toBeTrue()
  expect(projection.childNodes).toEqual(nodes)
  expect(pair.props.label).toBe("updated")
  root.unmount()
  expect(projection.childNodes).toHaveLength(0)
  independent.unmount()
  createDomRoot(staging).unmount()
})
