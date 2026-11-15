/** Снимок и изменения одного семантического документа. */
import {describe, expect, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import inspect from "@zavx0z/immersive-devtool"

describe.each([{name: "Поддерево документа", props: {text: "Содержимое"}}])("$name", ({props}) => {
  test("Идентичность и изменения", () => {
    const document = createDocument()
    const element = document.createElement("article")
    document.appendChild(element)
    const inspector = inspect({document})
    const changes: number[] = []
    const unsubscribe = inspector.subscribe(change => changes.push(...change.changedNodeIds))
    try {
      const id = inspector.idForNode(element)
      element.textContent = props.text
      const snapshot = inspector.snapshot(element)
      expect(snapshot.root, "Корень снимка сохраняет ID исходного элемента").toBe(id)
      expect(snapshot.nodes.some(node => node.nodeValue === props.text), "Снимок включает текст поддерева").toBe(true)
      expect(changes.includes(id), "Подписка сообщает изменение того же элемента").toBe(true)
    } finally {
      unsubscribe()
      inspector.dispose()
    }
    expect(inspector.nodeForId(1), "Освобождённый инспектор не удерживает обратный индекс").toBeNull()
  })
})
