import {expect, test} from "bun:test"
import {createDocument, DataTransfer, DragEvent} from "@zavx0z/immersive-dom"
import {createDocumentDragController} from "../src/index.ts"

test("document drag controller использует выбранную цель, bubbling и cancelable lifecycle", () => {
  const document = createDocument()
  const root = document.createElement("div")
  const child = document.createElement("button")
  document.append(root)
  root.append(child)
  const controller = createDocumentDragController(document)
  const transfer = new DataTransfer({types: ["Files"]})
  const calls: string[] = []
  root.addEventListener("dragenter", event => {
    expect((event as DragEvent).dataTransfer).toBe(transfer)
    expect(event.target).toBe(child)
    calls.push(event.type)
    event.preventDefault()
  })
  root.addEventListener("dragover", event => { calls.push(event.type); event.preventDefault() })
  root.addEventListener("dragleave", event => {
    expect(event.cancelable).toBe(false)
    expect((event as DragEvent).dataTransfer).toBeNull()
    calls.push(event.type)
  })
  expect(controller.dispatch("dragenter", child, {dataTransfer: transfer})).toBe(true)
  expect(controller.dispatch("dragover", child, {dataTransfer: transfer})).toBe(true)
  controller.clear(root)
  expect(controller.target).toBeNull()
  controller.dispose()
  expect(controller.dispatch("dragover", child, {})).toBe(false)
  expect(calls).toEqual(["dragenter", "dragover", "dragleave"])
})

test("cross-Document и отключённая drag-цели не получают drop", () => {
  const document = createDocument()
  const root = document.createElement("div")
  document.append(root)
  const other = createDocument()
  const foreign = other.createElement("div")
  other.append(foreign)
  const detached = document.createElement("div")
  let drops = 0
  for (const node of [foreign, detached]) node.addEventListener("drop", () => drops++)
  const controller = createDocumentDragController(document)
  expect(controller.dispatch("drop", foreign, {})).toBe(false)
  expect(controller.dispatch("drop", detached, {})).toBe(false)
  expect(drops).toBe(0)
  controller.dispose()
})
