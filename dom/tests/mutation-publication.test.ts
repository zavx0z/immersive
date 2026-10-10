import {expect, test} from "bun:test"
import {createDocument, observeConnection, type MutationBatch} from "../src/index.ts"

test("Document version учитывает mutations без подписчиков и очищает завершённую историю", () => {
  const document = createDocument(), root = document.createElement("main")
  document.append(root)
  const initialVersion = document.version
  document.transaction(() => {
    root.append("first")
    root.setAttribute("data-value", "first")
    root.firstChild!.nodeValue = "second"
    expect(document.version).toBe(initialVersion)
  })
  expect(document.version).toBe(initialVersion + 1)
  document.transaction(() => {})
  expect(document.version).toBe(initialVersion + 1)

  const batches: MutationBatch[] = []
  document.subscribeMutations(batch => { batches.push(batch) })
  root.setAttribute("data-value", "first")
  expect(document.version).toBe(initialVersion + 2)
  expect(batches).toHaveLength(1)
  expect(batches[0]!.records).toHaveLength(1)
  expect(batches[0]!.records[0]!.type).toBe("attributes")
})

test("Подписка внутри transaction получает pending removal snapshot без detached mutations", () => {
  const document = createDocument(), root = document.createElement("main")
  const left = document.createElement("span"), removed = document.createElement("div"), right = document.createElement("span")
  const text = document.createTextNode("initial")
  removed.append(text)
  root.append(left, removed, right)
  document.append(root)
  const calls: string[] = []
  const scope = observeConnection(removed, {
    attributes: ["title"],
    changed() { calls.push("changed") },
    disconnected() { calls.push("disconnected") }
  })
  document.flushTasks()
  const initialVersion = document.version, batches: MutationBatch[] = []
  document.transaction(() => {
    root.removeChild(removed)
    removed.setAttribute("title", "detached")
    text.data = "detached"
    removed.append("extra")
    document.subscribeMutations(batch => { batches.push(batch) })
    root.setAttribute("data-value", "after subscription")
  })
  expect(calls).toEqual(["disconnected", "changed"])
  expect(document.version).toBe(initialVersion + 1)
  expect(batches).toHaveLength(1)
  const batch = batches[0]!
  expect(batch.records.map(record => record.type)).toEqual(["childList", "attributes"])
  const removal = batch.records[0]!
  if (removal.type !== "childList") throw new Error("Expected removal record")
  expect(removal.target).toBe(root)
  expect(removal.addedNodes).toEqual([])
  expect(removal.removedNodes).toEqual([removed])
  expect(removal.previousSibling).toBe(left)
  expect(removal.nextSibling).toBe(right)
  expect(removal.removedNodes[0]).toBe(removed)
  expect(removed.textContent).toBe("detachedextra")
  expect(Object.isFrozen(batch)).toBe(true)
  expect(Object.isFrozen(batch.records)).toBe(true)
  expect(batch.records.every(Object.isFrozen)).toBe(true)
  expect(Object.isFrozen(removal.addedNodes)).toBe(true)
  expect(Object.isFrozen(removal.removedNodes)).toBe(true)
  scope.dispose()
  expect(calls).toEqual(["disconnected", "changed"])
})

test("Reentrant publication сохраняет version, порядок и независимые immutable batches", () => {
  const document = createDocument(), root = document.createElement("main")
  document.append(root)
  const initialVersion = document.version, batches: MutationBatch[] = []
  const stop = document.subscribeMutations(batch => {
    batches.push(batch)
    stop()
    root.setAttribute("data-next", "reentrant")
    document.subscribeMutations(next => { batches.push(next) })
  })
  root.append("first")
  expect(batches.map(batch => batch.version)).toEqual([initialVersion + 1, initialVersion + 2])
  expect(batches.map(batch => batch.records.map(record => record.type))).toEqual([["childList"], ["attributes"]])
  expect(batches.every(batch => Object.isFrozen(batch) && Object.isFrozen(batch.records))).toBe(true)
  expect(batches.flatMap(batch => batch.records).every(Object.isFrozen)).toBe(true)
  expect(batches[0]!.records).not.toBe(batches[1]!.records)
})

test("Удаление последнего подписчика до flush сохраняет version без отложенной доставки", () => {
  const document = createDocument(), root = document.createElement("main")
  document.append(root)
  const initialVersion = document.version, batches: MutationBatch[] = []
  const stop = document.subscribeMutations(batch => { batches.push(batch) })
  document.transaction(() => {
    root.append("unobserved at publication")
    stop()
  })
  expect(document.version).toBe(initialVersion + 1)
  expect(batches).toEqual([])
  document.subscribeMutations(batch => { batches.push(batch) })
  root.firstChild!.nodeValue = "observed"
  expect(batches.map(batch => batch.version)).toEqual([initialVersion + 2])
  expect(batches[0]!.records.map(record => record.type)).toEqual(["characterData"])
  expect(Object.isFrozen(batches[0]!.records[0])).toBe(true)
})
