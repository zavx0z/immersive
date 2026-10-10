/** Отражение принадлежит DOM, а не потребителю native property notifications. */
import type {DOMPropertyAttributes} from "../../contract/native-properties.ts"
const reflectionMetadata = Symbol("native property attributes")

export function definePropertyAttributes(owner: object, declarations: DOMPropertyAttributes): void {
  const prototype = typeof owner === "function" ? owner.prototype : owner
  if (prototype === null || typeof prototype !== "object") throw new TypeError("DOM property metadata requires a constructor or prototype")
  if (Object.hasOwn(prototype, reflectionMetadata)) throw new TypeError("DOM property metadata is already declared for this prototype")
  const fields: Record<string, readonly string[]> = Object.create(null)
  for (const [name, value] of Object.entries(declarations)) {
    const attributes = typeof value === "string" ? [value] : value
    if (!name || !Array.isArray(attributes) || !attributes.length || attributes.some(attribute => typeof attribute !== "string" || !attribute)) throw new TypeError("DOM property metadata requires nonempty property and attribute names")
    fields[name] = Object.freeze([...new Set(attributes.map(attribute => attribute.toLowerCase()))])
  }
  Object.defineProperty(prototype, reflectionMetadata, {value: Object.freeze(fields)})
}
const reflected = new Set([
  "id", "className", "slot", "title", "hidden", "contentEditable", "popover", "tabIndex",
  "disabled", "type", "defaultValue", "placeholder", "min", "max", "step", "readOnly", "required",
  "defaultChecked", "multiple", "size", "src", "alt", "width", "height", "htmlFor", "d", "value",
  "colSpan", "rowSpan", "scope", "rows", "cols", "maxLength", "minLength", "wrap", "label",
  "defaultSelected", "low", "high", "optimum", "name", "autoplay", "defaultMuted", "playsInline", "loop",
  "distance", "frameloop", "background", "x", "y", "z", "targetX", "targetY", "targetZ", "controls",
  "navigation", "flySpeed", "fov", "near", "far",
])
const exceptions: Readonly<Record<string, string>> = {
  className: "class", htmlFor: "for", defaultValue: "value", defaultChecked: "checked",
  defaultSelected: "selected", defaultMuted: "muted", targetX: "target-x", targetY: "target-y",
  targetZ: "target-z", flySpeed: "fly-speed",
}
export function nativePropertyAttribute(name: string): string | undefined {
  return reflected.has(name) ? exceptions[name] ?? name.toLowerCase() : undefined
}
export function nativePropertyAttributes(target: object, name: string): readonly string[] {
  for (let prototype: object | null = target; prototype; prototype = Object.getPrototypeOf(prototype)) {
    const fields = Object.getOwnPropertyDescriptor(prototype, reflectionMetadata)?.value as Readonly<Record<string, readonly string[]>> | undefined
    if (fields && Object.hasOwn(fields, name)) return fields[name]!
  }
  if (name === "value" || name === "valueAsNumber" || name === "valueAsDate") return ["value", "type", "min", "max", "step"]
  if (name === "checked") return ["checked", "type"]
  if (name === "muted") return ["muted"]
  const reflected = nativePropertyAttribute(name)
  return reflected === undefined ? [] : [reflected]
}
export const nativePropertyProjections: Readonly<Record<string, readonly string[]>> = {
  value: ["value", "valueAsNumber", "valueAsDate"],
  selection: ["selection", "selectionStart", "selectionEnd", "selectionDirection"],
}
