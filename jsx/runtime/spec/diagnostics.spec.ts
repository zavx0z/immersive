import {describe, expect, test} from "bun:test"
import {jsx} from "@jsx/runtime"
import {slotChild} from "@jsx/slot-child"
import {receiverTemplate, textTemplate} from "./fixture/index.ts"

describe("Отказы automatic JSX protocol", () => {
  test.each(["span", () => null, {}])("Неподготовленный template %p", type => {
    expect(() => jsx(type, null), "Авторская функция и intrinsic тег проходят compiler до runtime").toThrow("скомпилированный компонент")
  })
  test("Нестроковое назначение", () => {
    expect(() => jsx(textTemplate, {text: "Текст", slot: 1}), "Назначение slot является статической строкой").toThrow("static string name")
  })
  test("Неизвестная область", () => {
    const child = jsx(textTemplate, {text: "Текст", slot: "missing"})
    expect(() => jsx(receiverTemplate, {children: child}), "Ошибочное имя не создаёт неявную область получателя").toThrow('unknown slot "missing"')
  })
  test("Неверная keyed metadata", () => {
    const child = slotChild("header", null, "keyed")
    expect(() => jsx(receiverTemplate, {children: child}), "Keyed expression передаёт массив подготовленных детей").toThrow("requires an array")
  })
})
