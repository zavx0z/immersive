import type {PlanSlotsInput} from "../contract/input"

/**
Проверяет внешнюю форму входа перед обходом коллекций.
Эта граница нужна JavaScript-потребителям, не проверяемым TypeScript.

@throws TypeError Вход не является объектом с массивами outlets и children.
*/
export function assertSlotInput(input: unknown): asserts input is PlanSlotsInput {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("Slot plan input must be an object")
  }
  if (!("outlets" in input) || !Array.isArray(input.outlets)) {
    throw new TypeError("Slot plan outlets must be an array")
  }
  if (!("children" in input) || !Array.isArray(input.children)) {
    throw new TypeError("Slot plan children must be an array")
  }
}

/**
Принимает только строковое имя и сохраняет его без нормализации.

@param source Место имени во входе для диагностики неверного JavaScript-значения.
@throws TypeError Значение имени не является строкой.
*/
export function readSlotName(value: unknown, source: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`${source} must be a string`)
  }
  return value
}

/**
Читает назначение одного ребёнка, используя пустое имя при отсутствии slot.
Проверяет объект ребёнка и фактическое значение поля на JavaScript-границе.

@throws TypeError Ребёнок не является объектом либо slot не является строкой.
*/
export function readChildSlot(child: unknown, index: number): string {
  if (typeof child !== "object" || child === null || Array.isArray(child)) {
    throw new TypeError(`Slot child at index ${index} must be an object`)
  }
  const slot = "slot" in child ? child.slot : undefined
  return slot === undefined ? "" : readSlotName(slot, `Slot assignment at child index ${index}`)
}
