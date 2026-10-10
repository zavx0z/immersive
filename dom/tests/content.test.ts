import {expect, test} from "bun:test"
import {createDocument, DOMGroup, HTMLDivElement, domComponentConstructorBrand, retainDOMContent} from "../src/index.ts"

test("content snapshot consumes no Nodes and never resurrects a Fragment for another assignment", () => {
  const document = createDocument(), fragment = document.createDocumentFragment(), child = document.createElement("button")
  fragment.append(child)
  const input = {"": [fragment, "text"]}
  const accepted = retainDOMContent(document, input, [""])
  expect(accepted[""]).toEqual([[child], "text"])
  expect(fragment.firstChild).toBe(child)
  expect(Object.isFrozen(accepted)).toBe(true)
  expect(Object.isFrozen(accepted[""])).toBe(true)
  document.createElement("div").append(fragment)
  expect(retainDOMContent(document, input, [""])[""]).toEqual([[], "text"])
  expect(accepted[""]).toEqual([[child], "text"])
})

test("groups retain their whole identity and construction records remain inert, recursively retained data", () => {
  const document = createDocument(), group = new DOMGroup(document, "group"), fragment = document.createDocumentFragment()
  const node = document.createElement("span"), props = {label: "same"}, context = {}
  fragment.append(node)
  let constructions = 0
  class Ready extends HTMLDivElement {
    static readonly [domComponentConstructorBrand] = true as const
    static slots = ["header"]
    constructor(document: typeof group.ownerDocument) { super(document); constructions++ }
  }
  const retained = retainDOMContent(document, {"": group, child: {type: Ready as any, props, context, content: {header: fragment}}})
  expect(retained[""]).toBe(group)
  const construction = retained.child as any
  expect(construction.type).toBe(Ready)
  expect(construction.props).toBe(props)
  expect(construction.context).toBe(context)
  expect(construction.content.header).toEqual([node])
  expect(Object.isFrozen(construction.content.header)).toBe(true)
  expect(constructions).toBe(0)
})

test("foreign Document, repeated Nodes/Group span, cyclic arrays/maps and unknown slots reject without mutations", () => {
  const document = createDocument(), other = createDocument(), child = document.createElement("button")
  const fragment = document.createDocumentFragment()
  fragment.append(child)
  expect(() => retainDOMContent(document, {"": other.createDocumentFragment()})).toThrow("receiving Document")
  expect(() => retainDOMContent(document, {"": [fragment, child]})).toThrow("more than once")
  const group = new DOMGroup(document, child)
  expect(() => retainDOMContent(document, {"": [group, child]})).toThrow("more than once")
  const cycle: any[] = []
  cycle.push(cycle)
  expect(() => retainDOMContent(document, {"": cycle})).toThrow("itself")
  expect(() => retainDOMContent(document, {missing: "value"}, [""])).toThrow("Unknown DOM content slot")
  expect(group.nodes).toEqual([child])
})
