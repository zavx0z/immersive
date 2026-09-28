import {component, fixedChildren, keyedComponents, type ComponentKey, type ComponentValue} from "@zavx0z/component"
import {composeSlot, type ComposeSlotInput} from "@zavx0z/component/slot"
import {isCompiledTemplate, slotContents} from "@zavx0z/template/compiled"
import {planSlots} from "@zavx0z/template/slot"

export type {JSX} from "@zavx0z/template/jsx-runtime"

export const Fragment = Symbol("Headless.Fragment")

const assignments = new WeakMap<object, string>()
const slotChildBrand = Symbol("Headless.SlotChild")

/** Compiler metadata сохраняют одну синтаксическую позицию до распределения children. */
type AuthoredSlotChild = Readonly<{
  [slotChildBrand]: true
  content: unknown
  kind: "conditional" | "keyed"
  name: string
}>

/** Готовое содержимое одной фиксированной позиции и её статическое назначение. */
type PreparedChild = Readonly<{
  content: unknown
  name: string
}>

/**
Compiler transport сохраняет назначение условной позиции и границу keyed map.
Статическое имя приходит из AST до вычисления expression, поэтому пустой список
и null остаются в своей области без предположений о соседях.
*/
export function slotChild(name: string, content: unknown, kind: "conditional" | "keyed"): AuthoredSlotChild {
  if (typeof name !== "string" || (kind !== "conditional" && kind !== "keyed")) {
    throw new TypeError("Headless slot child requires a static name and composition kind")
  }
  return Object.freeze({[slotChildBrand]: true as const, name, content, kind})
}

/**
JSX в spec упаковывает уже скомпилированный компонент и props в публичный ComponentValue.
Production-TSX по-прежнему компилирует Template; этот транспорт не исполняет его функции.
Резервный атрибут slot хранится вне props. Родитель распределяет вложенный JSX
по объявленным точкам вставки тем же planSlots, который использует компилятор.
*/
export function jsx(type: unknown, props: Record<string, unknown> | null, key: ComponentKey = null): ComponentValue {
  if (type === Fragment) {
    const children = props?.children
    return fixedChildren(Array.isArray(children) ? children : children == null ? [] : [children])
  }
  if (!isCompiledTemplate(type)) {
    throw new Error("Headless ожидает скомпилированный компонент: подключите @immersive/headless/preload до загрузки TSX")
  }
  const {slot, ...componentProps} = props ?? {}
  if (props && Object.hasOwn(props, "slot") && typeof slot !== "string") {
    throw new TypeError("Headless slot requires a static string name")
  }
  const children = Object.hasOwn(componentProps, "children") ? authoredChildren(componentProps.children) : []
  const plan = planSlots({
    outlets: type.slots ?? [""],
    children: children.map(child => ({slot: child.name})),
  })
  if (type.slots !== undefined) {
    const ordinaryProps = {...componentProps}
    delete ordinaryProps.children
    const contents: Record<string, readonly unknown[]> = Object.create(null)
    for (const group of plan.slots) {
      contents[group.name] = group.children.map(index => children[index]!.content)
    }
    const value = component(type, {...ordinaryProps, [slotContents]: contents}, key)
    if (typeof slot === "string") assignments.set(value, slot)
    return value
  }
  if (containsSlotChild(componentProps.children)) {
    componentProps.children = Array.isArray(componentProps.children)
      ? composeSlot({content: children.map(child => child.content) as ComposeSlotInput["content"]})
      : children[0]?.content ?? null
  }
  const value = component(type, componentProps, key)
  if (typeof slot === "string") assignments.set(value, slot)
  return value
}

/** Разворачивает authored siblings, сохраняя nullable позиции и явную keyed границу. */
function authoredChildren(value: unknown): PreparedChild[] {
  if (Array.isArray(value)) return value.flatMap(authoredChildren)
  if (isAuthoredSlotChild(value)) {
    if (value.kind === "keyed") {
      if (!Array.isArray(value.content)) {
        throw new TypeError("Headless keyed slot child requires an array")
      }
      for (const child of value.content) {
        if (!hasCompiledTemplate(child) || child.key === null) {
          throw new TypeError("Headless dynamic JSX map components require key")
        }
        assertAssignment(value.name, child)
      }
      return [{name: value.name, content: keyedComponents(value.content)}]
    }
    if (value.content != null && typeof value.content !== "boolean") {
      if (!hasCompiledTemplate(value.content)) {
        throw new TypeError("Headless conditional slot child requires a component or null")
      }
      assertAssignment(value.name, value.content)
    }
    return [{name: value.name, content: value.content}]
  }
  return [{name: assignment(value), content: value}]
}

/** Отличает compiler transport от ComponentValue и произвольных пользовательских объектов. */
function isAuthoredSlotChild(value: unknown): value is AuthoredSlotChild {
  return value !== null && typeof value === "object" && slotChildBrand in value
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
    throw new TypeError("Headless slot child does not match its static assignment")
  }
}

/** Находит metadata среди фиксированных siblings, чтобы legacy props получили обычный transport. */
function containsSlotChild(value: unknown): boolean {
  return Array.isArray(value) ? value.some(containsSlotChild) : isAuthoredSlotChild(value)
}

export {jsx as jsxs, jsx as jsxDEV}
