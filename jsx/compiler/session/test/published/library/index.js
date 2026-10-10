import {defineCompiledTemplate, bindText, bindChild, writeBinding, slotContents} from "@zavx0z/immersive/XReact/compiled"
import {composeSlot} from "@zavx0z/immersive/XReact/slot"

export default defineCompiledTemplate({
  displayName: "Prepared",
  bindingCount: 2,
  slots: ["header"],
  mount(document) {
    const section = document.createElement("section")
    const text = document.createTextNode("")
    const start = document.createComment("header")
    const end = document.createComment("/header")
    section.append(text, start, end)
    return {nodes: [section], bindings: [bindText(text), bindChild(start, end)]}
  },
  render(props, values) {
    writeBinding(values, 0, props.value)
    writeBinding(values, 1, composeSlot({content: props[slotContents]?.header}))
  },
})
