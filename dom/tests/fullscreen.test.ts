import {expect, test} from "bun:test"
import {bindDocumentFullscreenHost, clearDocumentFullscreen, createDocument} from "../src/index.ts"

test("fullscreen state and selectors follow native acceptance while retaining element/stream identity", async () => {
  const document = createDocument()
  const root = document.createElement("div")
  const video = document.createElement("video")
  document.append(root)
  root.append(video)
  const stream = {getTracks: () => []}
  video.srcObject = stream
  let entries = 0
  let changes = 0
  document.addEventListener("fullscreenchange", () => changes++)
  const release = bindDocumentFullscreenHost(document, {enabled: () => true, async request() {entries++}, async exit() {}})
  try {
    await video.requestFullscreen()
    expect(document.fullscreenElement).toBe(video)
    expect(document.querySelector("video:fullscreen")).toBe(video)
    expect(video.matches(":fullscreen")).toBeTrue()
    const other = document.createElement("div")
    root.append(other)
    document.transaction(() => {video.remove(); other.append(video)})
    expect(document.fullscreenElement).toBe(video)
    expect(video.srcObject).toBe(stream)
    expect(entries).toBe(1)
    await document.exitFullscreen()
    expect(document.fullscreenElement).toBeNull()
    expect(document.querySelector(":fullscreen")).toBeNull()
    expect(video.parentNode).toBe(other)
    expect(changes).toBe(2)
  } finally {release()}
})

test("native refusal leaves presentation untouched; native exit and removal clear fullscreen", async () => {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  let refused = true
  let errors = 0
  let exits = 0
  document.addEventListener("fullscreenerror", () => errors++)
  const release = bindDocumentFullscreenHost(document, {enabled: () => true,
    async request() {if (refused) throw new Error("user activation required")}, async exit() {exits++}})
  try {
    await expect(element.requestFullscreen()).rejects.toThrow("user activation")
    expect(errors).toBe(1)
    expect(document.fullscreenElement).toBeNull()
    refused = false
    await element.requestFullscreen()
    clearDocumentFullscreen(document)
    expect(document.fullscreenElement).toBeNull()
    await element.requestFullscreen()
    element.remove()
    await Promise.resolve()
    expect(document.fullscreenElement).toBeNull()
    expect(exits).toBe(1)
  } finally {release()}
})

test("detaching a pending target cannot publish a late native entry", async () => {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  const entered = Promise.withResolvers<void>()
  let exits = 0
  const release = bindDocumentFullscreenHost(document, {enabled: () => true,
    request: () => entered.promise, async exit() {exits++}})
  try {
    const pending = element.requestFullscreen()
    const rejected = pending.catch(error => error)
    element.remove()
    entered.resolve()
    expect(await rejected).toMatchObject({name: "AbortError"})
    expect(document.fullscreenElement).toBeNull()
    expect(exits).toBeGreaterThan(0)
  } finally {release()}
})
