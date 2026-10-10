import {expect, test} from "bun:test"
import {
  createDocument, acquireDocumentAuthorStyleSheetOwner, acquireDocumentCompiledStyleSheets,
  readDocumentAuthorStyleSheets, readDocumentCompiledStyleSheets,
  subscribeDocumentAuthorStyleSheets, subscribeDocumentCompiledStyleSheets,
} from "../src/index.ts"

test("compiled stylesheet read видит leases до layout task, уведомление остаётся на commit", () => {
  const document = createDocument(), initial = readDocumentCompiledStyleSheets(document)
  const published: number[] = []
  subscribeDocumentCompiledStyleSheets(document, change => { published.push(change.revision) })
  let layoutRead = initial
  document.transaction(() => {
    const discarded = acquireDocumentCompiledStyleSheets(document, [{id: "discarded", cssText: "button { width: 1px }"}])
    const first = readDocumentCompiledStyleSheets(document)
    expect(first.styleSheets.map(sheet => sheet.id)).toEqual(["discarded"])
    expect(readDocumentCompiledStyleSheets(document)).toBe(first)
    discarded.release()
    acquireDocumentCompiledStyleSheets(document, [{id: "accepted", cssText: "button { width: 320px }"}])
    document.enqueueTask(() => {
      layoutRead = readDocumentCompiledStyleSheets(document)
      expect(layoutRead.styleSheets.map(sheet => sheet.id)).toEqual(["accepted"])
      expect(published).toEqual([])
    })
    expect(published).toEqual([])
  })
  expect(published).toEqual([layoutRead.revision])
  expect(layoutRead.revision).toBeGreaterThan(initial.revision)
  expect(initial.styleSheets).toHaveLength(0)
  expect(readDocumentCompiledStyleSheets(document)).toBe(layoutRead)
})

test("author stylesheet read актуален внутри transaction и immutable прошлые reads не меняются", () => {
  const document = createDocument(), owner = acquireDocumentAuthorStyleSheetOwner(document)
  const changes: number[] = []
  subscribeDocumentAuthorStyleSheets(document, change => { changes.push(change.revision) })
  const initial = readDocumentAuthorStyleSheets(document)
  document.transaction(() => {
    owner.replace([{id: "theme", cssText: "button { width: 1px }"}])
    const first = readDocumentAuthorStyleSheets(document)
    owner.replace([{id: "theme", cssText: "button { width: 320px }"}])
    const second = readDocumentAuthorStyleSheets(document)
    expect(first.styleSheets[0]?.cssText).toBe("button { width: 1px }")
    expect(second.styleSheets[0]?.cssText).toBe("button { width: 320px }")
    expect(second.revision).toBeGreaterThan(first.revision)
    expect(readDocumentAuthorStyleSheets(document)).toBe(second)
    expect(changes).toEqual([])
  })
  expect(changes).toEqual([readDocumentAuthorStyleSheets(document).revision])
  expect(initial.styleSheets).toHaveLength(0)
  owner.release()
  expect(changes).toHaveLength(2)
})

test("промежуточные reads не публикуют отсутствующее итоговое изменение", () => {
  const document = createDocument(), owner = acquireDocumentAuthorStyleSheetOwner(document)
  const changes: string[] = []
  subscribeDocumentAuthorStyleSheets(document, () => { changes.push("author") })
  subscribeDocumentCompiledStyleSheets(document, () => { changes.push("compiled") })
  document.transaction(() => {
    owner.replace([{id: "temporary", cssText: "div {}"}])
    expect(readDocumentAuthorStyleSheets(document).styleSheets).toHaveLength(1)
    owner.release()
    const lease = acquireDocumentCompiledStyleSheets(document, [{id: "temporary", cssText: "div {}"}])
    expect(readDocumentCompiledStyleSheets(document).styleSheets).toHaveLength(1)
    lease.release()
  })
  expect(readDocumentAuthorStyleSheets(document).styleSheets).toHaveLength(0)
  expect(readDocumentCompiledStyleSheets(document).styleSheets).toHaveLength(0)
  expect(changes).toEqual([])
})

test("отклонённый lease не меняет live snapshot, reentrant publication сохраняет порядок", () => {
  const document = createDocument(), order: string[] = []
  let lease: ReturnType<typeof acquireDocumentCompiledStyleSheets> | undefined
  subscribeDocumentCompiledStyleSheets(document, change => {
    order.push(`first:${change.styleSheets.length}`)
    if (change.styleSheets.length) lease?.release()
  })
  subscribeDocumentCompiledStyleSheets(document, change => { order.push(`second:${change.styleSheets.length}`) })
  document.transaction(() => {
    lease = acquireDocumentCompiledStyleSheets(document, [{id: "style", cssText: "div {}"}])
    const current = readDocumentCompiledStyleSheets(document)
    expect(() => acquireDocumentCompiledStyleSheets(document, [{id: "style", cssText: "span {}"}])).toThrow("collision")
    expect(readDocumentCompiledStyleSheets(document)).toBe(current)
  })
  expect(order).toEqual(["first:1", "second:1", "first:0", "second:0"])
})
