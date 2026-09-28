/**
Автоматический JSX protocol для уже подготовленных компонентов.

jsx и jsxs создают ComponentValue, распределяя вложенность единым planSlots.
Descriptor @jsx/slot-child сохраняет статическое имя и границу условного
ребёнка либо keyed map после вычисления expression. Protocol не исполняет авторскую функцию компонента
и не создаёт intrinsic DOM-узлы: они компилируются своим владельцем.

Несколько экспортов являются единым native интерфейсом automatic JSX runtime.
Fragment identity разделяется development protocol; служебные helpers остаются
внутри пакета. Типовой JSX namespace принадлежит @jsx/types.

@packageDocumentation
*/
import {component, fixedChildren, type ComponentKey} from "@zavx0z/component"
import {composeSlot, type ComposeSlotInput} from "@zavx0z/component/slot"
import {isCompiledTemplate, slotContents} from "@zavx0z/template/compiled"
import {planSlots} from "@jsx/slot"
import {assignments, authoredChildren, containsSlotChild} from "./src/children.ts"
import type {RuntimeInput} from "./contract/input.ts"
import type {RuntimeOutput} from "./contract/output.ts"

export type {JSX} from "./src/protocol.ts"
export type {RuntimeInput} from "./contract/input.ts"
export type {RuntimeOutput} from "./contract/output.ts"

/** Native Fragment объединяет подготовленные siblings без semantic Element. */
export const Fragment = Symbol("JSX.Fragment")

/** Собирает готовый компонент и его slot-группы через обычный lifecycle Component. */
export function jsx(type: RuntimeInput[0], props: RuntimeInput[1], key: ComponentKey = null): RuntimeOutput {
  if (type === Fragment) {
    const children = props?.children
    return fixedChildren(Array.isArray(children) ? children : children == null ? [] : [children])
  }
  if (!isCompiledTemplate(type)) {
    throw new Error("JSX ожидает скомпилированный компонент: подключите JSX compiler до загрузки TSX")
  }
  const {slot, ...componentProps} = props ?? {}
  if (props && Object.hasOwn(props, "slot") && typeof slot !== "string") {
    throw new TypeError("JSX slot requires a static string name")
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

/** Native вариант для нескольких authored children сохраняет ту же семантику jsx. */
export function jsxs(type: RuntimeInput[0], props: RuntimeInput[1], key: ComponentKey = null): RuntimeOutput {
  return jsx(type, props, key)
}
