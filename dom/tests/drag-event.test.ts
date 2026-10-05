import {expect, test} from "bun:test"
import {createDocument, DataTransfer, DragEvent, MouseEvent, releaseDataTransfer, sealDataTransfer} from "../src/index.ts"

test("DragEvent сохраняет MouseEvent и распространяет общий FileList по Document", () => {
  const document = createDocument()
  const root = document.createElement("div")
  const child = document.createElement("div")
  document.append(root)
  root.append(child)
  const file = new File(["data"], "fixture.txt", {type: "text/plain"})
  const transfer = new DataTransfer({files: [file], dropEffect: "copy", effectAllowed: "all"})
  sealDataTransfer(transfer)
  const list = transfer.files
  expect(list.length).toBe(1)
  expect(list[0]).toBe(file)
  expect(list.item(0)).toBe(file)
  expect(list.item(1)).toBeNull()
  expect(Array.from(list)).toEqual([file])
  expect(transfer.types).toEqual(["Files"])
  expect(Reflect.set(list, "0", file)).toBe(false)
  expect(Reflect.set(transfer, "files", list)).toBe(false)
  const calls: unknown[] = []
  document.addEventListener("drop", event => {
    calls.push([event.target, (event as DragEvent).dataTransfer])
    event.preventDefault()
  })
  const event = new DragEvent("drop", {bubbles: true, cancelable: true, clientX: 12, dataTransfer: transfer})
  expect(event instanceof MouseEvent).toBe(true)
  expect(child.dispatchEvent(event)).toBe(false)
  expect(calls).toEqual([[child, transfer]])
  expect(event.clientX).toBe(12)
  releaseDataTransfer(transfer)
  expect(transfer.files).toBe(list)
  expect(list.length).toBe(0)
  expect(list.item(0)).toBeNull()
  expect(list[0]).toBeUndefined()
  expect(Array.from(list)).toEqual([])
  expect(transfer.types).toEqual([])
  expect(new DragEvent("drop").dataTransfer).toBeNull()
})

test("protected payload объявляет Files, сохраняет ограничения effects и освобождает строки", () => {
  const transfer = new DataTransfer({types: ["Files"], effectAllowed: "copyMove"})
  transfer.setData("TEXT", "fixture")
  sealDataTransfer(transfer)
  expect(transfer.files.length).toBe(0)
  expect(transfer.types).toEqual(["Files", "text/plain"])
  transfer.effectAllowed = "all"
  expect(String(transfer.effectAllowed)).toBe("copyMove")
  transfer.dropEffect = "copy"
  expect(transfer.dropEffect).toBe("copy")
  transfer.dropEffect = "invalid" as "copy"
  expect(transfer.dropEffect).toBe("copy")
  transfer.clearData()
  expect(transfer.getData("text/plain")).toBe("fixture")
  releaseDataTransfer(transfer)
  expect(transfer.getData("text/plain")).toBe("")
})
