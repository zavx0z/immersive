/** Один Parameter сохраняет revision, снимки и жизненный цикл подписок. */
import {describe, expect, test} from "bun:test"
import Parameter from "@nodes/parameter-store"

describe.each([
  {name: "Первый параметр", props: {id: "first", value: 1, next: 2}},
  {name: "Отрицательное значение", props: {id: "second", value: -2, next: -1}},
])("$name", ({props}) => {
  const parameter = new Parameter(props.id, props.value)
  const before = parameter.snapshot()
  let notifications = 0
  const release = parameter.subscribe(() => { notifications += 1 })
  const unchanged = parameter.set(props.value)
  const changed = parameter.set(props.next)
  const after = parameter.snapshot()
  release()
  parameter.set(props.next + 1)
  test("Снимки и revision", () => {
    expect([unchanged, changed], "Равное значение не создаёт изменение").toEqual([false, true])
    expect(before, "Прежний снимок остаётся неизменяемым").toEqual({id: props.id, revision: 0, value: props.value, presentation: null})
    expect(after, "Фиксация значения увеличивает revision один раз").toEqual({id: props.id, revision: 1, value: props.next, presentation: null})
    expect(Object.isFrozen(before) && Object.isFrozen(after), "Снимки не допускают внешнюю запись").toBeTrue()
  })
  test("Завершение подписки", () => {
    expect(notifications, "После release подписчик больше не получает обновления").toBe(1)
    expect(parameter.value, "Завершение подписки не останавливает сам Store").toBe(props.next + 1)
  })
  test("Ошибки слушателей после фиксации", () => {
    let delivered = false
    parameter.subscribe(() => { throw new Error("listener") })
    parameter.subscribe(() => { delivered = true })
    expect(() => parameter.set(props.next + 2), "Ошибки собираются после вызова всех слушателей").toThrow(AggregateError)
    expect(delivered, "Один слушатель не отменяет доставку следующему").toBeTrue()
    expect(parameter.value, "Ошибка слушателя не откатывает уже принятое значение").toBe(props.next + 2)
  })
})
