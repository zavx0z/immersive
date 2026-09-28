import type {SlotChildOutput} from "@jsx/slot-child"
import {keyedComponents, type ComponentValue} from "@zavx0z/component"
import {isCompiledTemplate} from "@zavx0z/template/compiled"

/** Статические назначения принадлежат готовым значениям одного runtime-модуля. */
export const assignments = new WeakMap<object, string>()
/** Готовое содержимое одной фиксированной позиции и её статическое назначение. */
type PreparedChild = Readonly<{
  content: unknown
  name: string
}>

/** Пропускает undefined и разворачивает authored siblings, сохраняя условные позиции и явную keyed границу. */
export function authoredChildren(value: unknown): PreparedChild[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value.flatMap(authoredChildren)
  if (isSlotChild(value)) {
    if (value.kind === "keyed") {
      if (!Array.isArray(value.content)) {
        throw new TypeError("JSX keyed slot child requires an array")
      }
      for (const child of value.content) {
        if (!hasCompiledTemplate(child) || child.key === null) {
          throw new TypeError("JSX dynamic JSX map components require key")
        }
        assertAssignment(value.name, child)
      }
      return [{name: value.name, content: keyedComponents(value.content)}]
    }
    if (value.content != null && typeof value.content !== "boolean") {
      if (!hasCompiledTemplate(value.content)) {
        throw new TypeError("JSX conditional slot child requires a component or null")
      }
      assertAssignment(value.name, value.content)
    }
    return [{name: value.name, content: value.content}]
  }
  return [{name: assignment(value), content: value}]
}

/** Отличает compiler transport от ComponentValue и произвольных пользовательских объектов. */
function isSlotChild(value: unknown): value is SlotChildOutput {
  if (value === null || typeof value !== "object" ||
    !("@zavx0z/jsx/slot-child" in value) || value["@zavx0z/jsx/slot-child"] !== true) return false
  if (!("name" in value) || typeof value.name !== "string" ||
    !("kind" in value) || (value.kind !== "conditional" && value.kind !== "keyed") ||
    !("content" in value)) {
    throw new TypeError("JSX slot child requires a static name and composition kind")
  }
  return true
}

/** Проверяет форму подготовленного component value; keyedComponents дополнительно проверяет его brand. */
function hasCompiledTemplate(value: unknown): value is ComponentValue {
  return value !== null && typeof value === "object" && "template" in value && isCompiledTemplate(value.template)
}

/** Читает вынесенное из props назначение; неназначенный ребёнок принадлежит default. */
function assignment(value: unknown): string {
  return value !== null && typeof value === "object" ? assignments.get(value) ?? "" : ""
}

/** Не позволяет metadata expression изменить фактическое статическое назначение JSX ребёнка. */
function assertAssignment(name: string, value: ComponentValue): void {
  if (assignment(value) !== name) {
    throw new TypeError("JSX slot child does not match its static assignment")
  }
}

/** Находит metadata среди фиксированных siblings, чтобы legacy props получили обычный transport. */
export function containsSlotChild(value: unknown): boolean {
  return Array.isArray(value) ? value.some(containsSlotChild) : isSlotChild(value)
}
