/**
Распределение вложенного содержимого по точкам вставки Template.
Общий план связывает имена областей с исходными индексами детей,
сохраняя порядок и пустые области. Он не создаёт DOM и не управляет
экземплярами компонентов.

В авторском JSX получатель объявляет `<slot name="header" />` и `<slot />`.
Вложенный компонент с `slot="header"` назначается именованной области,
без атрибута — безымянной. `slot` не попадает в props дочернего компонента.
Содержимое передаётся между тегами; явный `children={...}` запрещён как
у вызываемого компонента, так и у `<slot>`. В props получателя не требуется
объявлять children: Template связывает точки вставки при компиляции.

Имена статичны и уникальны у получателя. Неизвестное назначение отвергается.
Вложенность самого `<slot>` задаёт fallback, который используется при пустом
назначенном содержимом; 0 остаётся текстом. Слоты поддерживают передачу через
обёртку: `<slot name="header" slot="toolbar" />` передаёт своё содержимое
в toolbar следующего получателя без промежуточного mount.

При обновлениях фиксированной области сохраняются экземпляры, а keyed map
сохраняет identity по ключам. Перенос между разными областями не поддерживается.
Это собственная семантика Template без Shadow DOM и HTMLSlotElement API.

@example
```tsx
function Panel() {
  return (
    <section>
      <header>
        <slot name="header" />
      </header>
      <main>
        <slot />
      </main>
    </section>
  )
}
```

@packageDocumentation
*/
import type {PlanSlotsInput} from "./contract/input"
import type {PlanSlotsOutput} from "./contract/output"
import {assertSlotInput, readChildSlot, readSlotName} from "./src/input"

export type {PlanSlotsInput} from "./contract/input"
export type {PlanSlotsOutput} from "./contract/output"

/**
Назначает каждого ребёнка одной объявленной области без изменения входа.
Области следуют порядку outlets, а индексы внутри них — порядку children.
Безымянная область объявляется явно пустой строкой, даже когда назначения
детей не содержат поля slot.

@returns Все объявленные области, включая области без назначенных детей.
@throws TypeError Внешняя форма входа, ребёнок или фактическое имя не соответствуют контракту.
@throws Error Имя области повторяется либо назначение ребёнка не объявлено в outlets.
*/
export function planSlots(input: PlanSlotsInput): PlanSlotsOutput {
  assertSlotInput(input)
  const slots: {name: string; children: number[]}[] = []
  const byName = new Map<string, {name: string; children: number[]}>()

  for (const [index, outlet] of input.outlets.entries()) {
    const name = readSlotName(outlet, `Slot outlet at index ${index}`)
    if (byName.has(name)) {
      throw new Error(`Duplicate slot outlet ${JSON.stringify(name)}`)
    }
    const slot: {name: string; children: number[]} = {name, children: []}
    slots.push(slot)
    byName.set(name, slot)
  }

  for (const [index, child] of input.children.entries()) {
    const name = readChildSlot(child, index)
    const slot = byName.get(name)
    if (!slot) {
      const declared = input.outlets.map(outlet => JSON.stringify(outlet)).join(", ") || "none"
      throw new Error(`Child at index ${index} assigns unknown slot ${JSON.stringify(name)}; declared outlets: ${declared}`)
    }
    slot.children.push(index)
  }

  return {slots}
}
