/** Достоверные constructors встроенных DOM tags; остальные сохраняют Document factories. */
export const nativeElementClasses = {
  button: "HTMLButtonElement", div: "HTMLDivElement", fieldset: "HTMLFieldSetElement",
  h1: "HTMLHeadingElement", h2: "HTMLHeadingElement", h3: "HTMLHeadingElement", h4: "HTMLHeadingElement", h5: "HTMLHeadingElement", h6: "HTMLHeadingElement",
  input: "HTMLInputElement", img: "HTMLImageElement", video: "HTMLVideoElement", label: "HTMLLabelElement",
  li: "HTMLLIElement", legend: "HTMLLegendElement", meter: "HTMLMeterElement", option: "HTMLOptionElement",
  p: "HTMLParagraphElement", progress: "HTMLProgressElement", select: "HTMLSelectElement", span: "HTMLSpanElement",
  table: "HTMLTableElement", tbody: "HTMLTableSectionElement", td: "HTMLTableCellElement", textarea: "HTMLTextAreaElement",
  tfoot: "HTMLTableSectionElement", th: "HTMLTableCellElement", thead: "HTMLTableSectionElement", tr: "HTMLTableRowElement",
  ul: "HTMLUListElement", "vector-path": "HTMLVectorPathElement",
  space: "SpaceElement", viewpoint: "ViewPointElement", display: "DisplayElement", hud: "HUDElement",
} as const
