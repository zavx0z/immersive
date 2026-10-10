import {
  bindConditional,
  bindText,
  bindNode,
  defineCompiledTemplate,
  writeBinding,
  type CompiledTemplate,
} from "@zavx0z/immersive-template/compiled"
import type {Node} from "@zavx0z/immersive-dom"
import type {ComposeSlotOutput} from "../contract/output.ts"

/**
Значение текста, обновляемое обычным text binding без семантической обёртки.

@property value - Уже проверенный primitive; пустая строка отсекается до композиции.
*/
type SlotTextProps = Readonly<{value: string | number | bigint}>

const fixedSlotTemplates = new Map<number, CompiledTemplate<readonly ComposeSlotOutput[]>>()

/** Существующие узлы занимают обычную область Component без Element-обёртки. */
export const slotNodeTemplate = defineCompiledTemplate<Readonly<{value: Node}>>({
  displayName: "SlotNodes",
  bindingCount: 1,
  mount(document) {
    const start = document.createComment("nodes:start")
    const end = document.createComment("nodes:end")
    return {nodes: [start, end], bindings: [bindNode(start, end)]}
  },
  render(props, values) { writeBinding(values, 0, props.value) },
})

export const slotTextTemplate = defineCompiledTemplate<SlotTextProps>({
  displayName: "SlotText",
  bindingCount: 1,
  /** Создаёт Text в Document получателя, не добавляя Element-обёртку. */
  mount(document) {
    const text = document.createTextNode("")
    return {nodes: [text], bindings: [bindText(text)]}
  },
  /** Передаёт primitive действующему text binding, сохраняя identity Text. */
  render(props, values) {
    writeBinding(values, 0, props.value)
  },
})

/**
Возвращает один общий template для фиксированного числа соседних областей.

Кэш сохраняет template identity при повторной композиции массива той же длины.
Каждая позиция имеет собственные anchors, поэтому пустой сосед не сдвигает
state и refs следующих позиций. Anchors принадлежат Document получателя.

@param count - Длина подготовленного непустого массива; положительное целое.
Вызывающий код получает её из длины массива, не из авторского числового prop.
*/
export function fixedSlotTemplate(count: number): CompiledTemplate<readonly ComposeSlotOutput[]> {
  let template = fixedSlotTemplates.get(count)
  if (template !== undefined) return template
  template = defineCompiledTemplate<readonly ComposeSlotOutput[]>({
    displayName: "SlotGroup",
    bindingCount: count,
    /** Создаёт независимую conditional-область для каждой исходной позиции. */
    mount(document) {
      const pairs = Array.from({length: count}, () => [
        document.createComment("slot:start"),
        document.createComment("slot:end"),
      ] as const)
      return {
        nodes: pairs.flat(),
        bindings: pairs.map(([start, end]) => bindConditional(start, end)),
      }
    },
    /** Обновляет позиции без фильтрации пустых значений и перестановки соседей. */
    render(props, values) {
      for (let index = 0; index < count; index++) {
        writeBinding(values, index, props[index])
      }
    },
  })
  fixedSlotTemplates.set(count, template)
  return template
}
