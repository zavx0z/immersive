import {expect, test} from "bun:test"
import {createDocument, observeConnection} from "../src/index.ts"

test("flushTasks внутри открытой transaction ждёт reactions вместо повторного drain", () => {
  const document = createDocument(), root = document.createElement("div"), child = document.createElement("button")
  document.append(root)
  const calls: string[] = []
  const scope = observeConnection(child, {connected() { calls.push("connected") }})
  document.transaction(() => {
    root.append(child)
    document.enqueueTask(() => { calls.push("task") })
    document.flushTasks()
    expect(calls).toEqual([])
  })
  expect(calls).toEqual(["connected", "task"])
  scope.dispose()
})

test("one Document queue deduplicates, cancels, drains reentrant work before mutation publication", async () => {
  const document = createDocument(), root = document.createElement("main")
  document.append(root)
  const calls: string[] = []
  const write = () => { calls.push("write"); root.textContent = "updated" }
  const cancel = () => calls.push("cancelled")
  document.subscribeMutations(() => { expect(root.textContent).toBe("updated"); calls.push("publish") })
  document.transaction(() => {
    document.enqueueTask(() => { document.enqueueTask(write); document.cancelTask(cancel) })
    document.enqueueTask(cancel)
    document.enqueueTask(write)
    document.enqueueTask(write)
    expect(calls).toEqual([])
  })
  expect(calls).toEqual(["write", "publish"])
  const asyncTask = () => calls.push("microtask")
  document.enqueueTask(asyncTask)
  document.enqueueTask(asyncTask)
  await Promise.resolve()
  expect(calls).toEqual(["write", "publish", "microtask"])
})

test("connection callbacks are settled after final task output and before observers", () => {
  const document = createDocument(), root = document.createElement("main"), child = document.createElement("div")
  document.append(root)
  const calls: string[] = []
  observeConnection(child, {connected() { calls.push("connected"); child.textContent = "ready" }})
  document.subscribeMutations(() => { expect(child.textContent).toBe("ready"); calls.push("publish") })
  document.transaction(() => { document.enqueueTask(() => root.append(child)) })
  expect(calls).toEqual(["connected", "publish"])
})

test("task/connection errors do not suppress later callbacks or mutation publication, including throw undefined", () => {
  const document = createDocument(), root = document.createElement("main")
  document.append(root)
  const calls: string[] = [], error = new Error("failed")
  expect(() => document.transaction(() => {
    document.enqueueTask(() => { throw error })
    document.enqueueTask(() => { root.textContent = "changed"; calls.push("second") })
    document.subscribeMutations(() => calls.push("publish"))
  })).toThrow(error)
  expect(calls).toEqual(["second", "publish"])
  const child = document.createElement("span")
  observeConnection(child, {connected() { throw undefined }})
  observeConnection(child, {connected() { calls.push("connected-second") }})
  let thrown = false
  try { root.append(child) } catch { thrown = true }
  expect(thrown).toBe(true)
  expect(calls).toContain("connected-second")
  document.flushTasks()
})

test("scope cleanup tolerates self-removal and disposal during adoption without duplicate cleanup", () => {
  const first = createDocument(), second = createDocument()
  const root = first.createElement("main"), target = second.createElement("main"), child = first.createElement("div")
  first.append(root); second.append(target)
  const calls: string[] = []
  const scope = observeConnection(child, {
    connected() { calls.push("connected") },
    disconnected() { calls.push("disconnected"); scope.dispose() },
    adopted() { calls.push("adopted") }
  })
  root.append(child)
  target.append(child)
  expect(calls).toEqual(["connected", "disconnected"])
  const auto = second.createElement("span")
  observeConnection(auto, {connected() { calls.push("auto-connect"); auto.remove() }, disconnected() { calls.push("auto-disconnect") }})
  target.append(auto)
  expect(calls.slice(-2)).toEqual(["auto-connect", "auto-disconnect"])
})

test("unstable task callback fails with a finite bound and can be retried", () => {
  const document = createDocument()
  const task = () => document.enqueueTask(task)
  document.enqueueTask(task)
  expect(() => document.flushTasks()).toThrow("100 passes")
  let called = false
  document.enqueueTask(() => { called = true })
  document.flushTasks()
  expect(called).toBe(true)
})

test("Document scope and already connected Node are observed at next explicit commit", () => {
  const document = createDocument(), root = document.createElement("main")
  document.append(root)
  const calls: string[] = []
  const scope = observeConnection(document, {connected() { calls.push("document") }})
  observeConnection(root, {connected() { calls.push("node") }})
  expect(calls).toEqual([])
  document.flushTasks()
  expect(calls).toEqual(["document", "node"])
  scope.dispose()
})
