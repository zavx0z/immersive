import {describe, expect, test} from "bun:test"
import {planSlots, type PlanSlotsInput} from "@jsx/slot"

describe("Невалидное распределение слотов", () => {
  test.each([
    {
      name: "Повтор именованной точки вставки",
      input: {outlets: ["header", "header"], children: []},
      message: 'Duplicate slot outlet "header"',
    },
    {
      name: "Повтор безымянной точки вставки",
      input: {outlets: ["", ""], children: []},
      message: 'Duplicate slot outlet ""',
    },
    {
      name: "Неизвестное именованное назначение",
      input: {outlets: ["", "header"], children: [{slot: "haeder"}]},
      message: 'Child at index 0 assigns unknown slot "haeder"; declared outlets: "", "header"',
    },
    {
      name: "Безымянное назначение без точки вставки",
      input: {outlets: ["header"], children: [{}]},
      message: 'Child at index 0 assigns unknown slot ""; declared outlets: "header"',
    },
    {
      name: "Пустое назначение без точки вставки",
      input: {outlets: ["header"], children: [{slot: ""}]},
      message: 'Child at index 0 assigns unknown slot ""; declared outlets: "header"',
    },
    {
      name: "Дети без объявленных областей",
      input: {outlets: [], children: [{slot: "header"}]},
      message: 'Child at index 0 assigns unknown slot "header"; declared outlets: none',
    },
  ])("$name", ({input, message}) => {
    expect(
      () => planSlots(input),
      "Отказ называет повтор либо неизвестное назначение и не создаёт неоднозначный план.",
    ).toThrow(message)
  })
})

describe("JavaScript-граница входа", () => {
  test.each([
    {name: "Вход null", input: null, message: "Slot plan input must be an object"},
    {name: "Нет outlets", input: {children: []}, message: "Slot plan outlets must be an array"},
    {name: "Outlets не массив", input: {outlets: "header", children: []}, message: "Slot plan outlets must be an array"},
    {name: "Children не массив", input: {outlets: [], children: {}}, message: "Slot plan children must be an array"},
    {name: "Числовое имя области", input: {outlets: [1], children: []}, message: "Slot outlet at index 0 must be a string"},
    {name: "Имя области boolean", input: {outlets: [false], children: []}, message: "Slot outlet at index 0 must be a string"},
    {name: "Область null", input: {outlets: [null], children: []}, message: "Slot outlet at index 0 must be a string"},
    {name: "Область undefined", input: {outlets: [undefined], children: []}, message: "Slot outlet at index 0 must be a string"},
    {name: "Ребёнок null", input: {outlets: [""], children: [null]}, message: "Slot child at index 0 must be an object"},
    {name: "Ребёнок не объект", input: {outlets: [""], children: [1]}, message: "Slot child at index 0 must be an object"},
    {name: "Ребёнок массив", input: {outlets: [""], children: [[]]}, message: "Slot child at index 0 must be an object"},
    {name: "Числовое назначение", input: {outlets: [""], children: [{slot: 1}]}, message: "Slot assignment at child index 0 must be a string"},
    {name: "Назначение null", input: {outlets: [""], children: [{slot: null}]}, message: "Slot assignment at child index 0 must be a string"},
    {name: "Назначение boolean", input: {outlets: [""], children: [{slot: false}]}, message: "Slot assignment at child index 0 must be a string"},
  ])("$name", ({input, message}) => {
    let actual: unknown
    try {
      // Приведение намеренно пропускает статическую проверку для проверки внешнего JavaScript-входа.
      planSlots(input as PlanSlotsInput)
    } catch (error) {
      actual = error
    }

    expect(actual, "Неверное фактическое значение отклоняется на границе контракта").toBeInstanceOf(TypeError)
    expect(actual, "Диагностика указывает конкретное поле или индекс неверного значения").toHaveProperty("message", message)
  })
})
