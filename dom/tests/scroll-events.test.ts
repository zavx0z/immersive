import {expect, test} from "bun:test"
import {createDocument} from "../src/index.ts"

test("scroll доставляется асинхронно один раз с последними смещениями обеих осей", async () => {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  const offsets: number[][] = []
  let captured = 0
  let bubbled = 0
  document.addEventListener("scroll", () => { captured++ }, true)
  document.addEventListener("scroll", () => { bubbled++ })
  element.addEventListener("scroll", event => {
    expect(event.target).toBe(element)
    expect(event.bubbles).toBeFalse()
    expect(event.cancelable).toBeFalse()
    offsets.push([element.scrollLeft, element.scrollTop])
  })
  element.scrollTop = 24
  element.scrollBy({top: 24, left: 10})
  expect(offsets).toEqual([])
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(offsets).toEqual([[10, 48]])
  expect(captured).toBe(1)
  expect(bubbled).toBe(0)
  element.scrollTo({top: 48, left: 10})
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(offsets).toHaveLength(1)
})

test("транзакция без итогового изменения не отправляет scroll", async () => {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  let count = 0
  element.addEventListener("scroll", () => { count++ })
  document.transaction(() => {
    element.scrollTop = 24
    element.scrollTop = 0
  })
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(count).toBe(0)
  document.transaction(() => {
    element.scrollTop = 24
    element.scrollTop = 48
  })
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(count).toBe(1)
})

test("отключённый элемент не получает отложенное событие", async () => {
  const document = createDocument()
  const root = document.createElement("div")
  const element = document.createElement("div")
  document.append(root)
  root.append(element)
  let count = 0
  element.addEventListener("scroll", () => { count++ })
  element.scrollTop = 24
  element.remove()
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(count).toBe(0)
  element.scrollTop = 48
  root.append(element)
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(count).toBe(0)
  element.scrollTop = 72
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(count).toBe(1)
})

test("прокрутка из обработчика не вызывает рекурсивную доставку", async () => {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  const values: number[] = []
  let handling = false
  element.addEventListener("scroll", () => {
    expect(handling).toBeFalse()
    handling = true
    values.push(element.scrollTop)
    if (element.scrollTop === 24) element.scrollTop = 48
    handling = false
  })
  element.scrollTop = 24
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(values).toEqual([24, 48])
})

test("очередь сохраняет порядок элементов и независимость документов", async () => {
  const first = createDocument()
  const second = createDocument()
  const root = first.createElement("div")
  const child = first.createElement("div")
  const other = second.createElement("div")
  first.append(root)
  root.append(child)
  second.append(other)
  const events: string[] = []
  root.addEventListener("scroll", () => { events.push("root") })
  child.addEventListener("scroll", () => { events.push("child") })
  other.addEventListener("scroll", () => { events.push("other") })
  child.scrollTop = 24
  root.scrollTop = 24
  child.scrollTop = 48
  other.scrollTop = 24
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(events).toEqual(["child", "root", "other"])
})
