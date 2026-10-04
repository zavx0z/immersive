import {component} from "@zavx0z/immersive-component"
import {composeSlot, type ComposeSlotInput} from "@zavx0z/immersive-component/slot"
import {bindConditional, bindText, defineCompiledTemplate, slotContents, writeBinding} from "@zavx0z/immersive-template/compiled"

/** Настоящий готовый шаблон текста для native protocol, без авторского runtime JSX. */
export const textTemplate = defineCompiledTemplate<{text: string}>({
  displayName: "Текст protocol",
  bindingCount: 1,
  mount(document) {
    const span = document.createElement("span")
    const text = document.createTextNode("")
    span.append(text)
    return {nodes: [span], bindings: [bindText(text)]}
  },
  render(props, values) {
    writeBinding(values, 0, props.text)
  },
})

/** Подготовленные группы получателя принадлежат compiler ABI. */
type ReceiverProps = {
  [slotContents]?: Readonly<Record<string, readonly ComposeSlotInput["content"][]>>
}

/** Готовый получатель вставляет default и header через обычные conditional bindings. */
export const receiverTemplate = defineCompiledTemplate<ReceiverProps>({
  displayName: "Получатель protocol",
  slots: ["header", ""],
  bindingCount: 2,
  mount(document) {
    const article = document.createElement("article")
    const ranges = ["header", ""].map(name => {
      const region = document.createElement("section")
      region.setAttribute("data-region", name)
      const start = document.createComment("slot:start")
      const end = document.createComment("slot:end")
      region.append(start, end)
      article.append(region)
      return bindConditional(start, end)
    })
    return {nodes: [article], bindings: ranges}
  },
  render(props, values) {
    for (const [index, name] of ["header", ""].entries()) {
      const content = composeSlot({content: props[slotContents]?.[name]})
      writeBinding(values, index, content ?? component(textTemplate, {text: "Резерв"}))
    }
  },
})
