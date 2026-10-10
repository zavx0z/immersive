import {defineCompiledTemplate, bindText, bindChild, writeBinding, slotContents} from "@zavx0z/immersive/XReact/compiled"
import {composeSlot} from "@zavx0z/immersive/XReact/slot"

export default defineCompiledTemplate({
  displayName: "PreparedDefault",
  bindingCount: 3,
  slots: ["", "header"],
  mount(document) {
    const section = document.createElement("section")
    const text = document.createTextNode("")
    const headerStart = document.createComment("header")
    const headerEnd = document.createComment("/header")
    const defaultStart = document.createComment("default")
    const defaultEnd = document.createComment("/default")
    section.append(text, headerStart, headerEnd, defaultStart, defaultEnd)
    return {nodes: [section], bindings: [bindText(text), bindChild(headerStart, headerEnd), bindChild(defaultStart, defaultEnd)]}
  },
  render(props, values) {
    writeBinding(values, 0, props.value)
    writeBinding(values, 1, composeSlot({content: props[slotContents]?.header}))
    writeBinding(values, 2, composeSlot({content: props[slotContents]?.[""]}))
  },
})
