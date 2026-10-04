import {describe, expect, test} from "bun:test"
import jsxEventNames, {type JsxEventName} from "@immersive-jsx/event"

describe.each([
  {name: "Указатель", props: ["onClick", "onPointerDown", "onDoubleClick"], expected: ["click", "pointerdown", "dblclick"]},
  {name: "Фокус и клавиатура", props: ["onFocus", "onBlur", "onKeyDown"], expected: ["focus", "blur", "keydown"]},
  {name: "Ввод и буфер обмена", props: ["onInput", "onCopy", "onPaste"], expected: ["input", "copy", "paste"]},
  {name: "Анимация и transition", props: ["onAnimationEnd", "onTransitionEnd"], expected: ["animationend", "transitionend"]},
])("$name", ({props, expected}: {props: readonly JsxEventName[]; expected: readonly (typeof jsxEventNames)[JsxEventName][]}) => {
  const actual = jsxEventNames

  test("Нативные имена событий", () => {
    expect(props.map(name => actual[name]), "Имена обработчиков JSX соответствуют стандартным DOM event types").toEqual([...expected])
  })
  test("Неизменяемая таблица", () => {
    expect(Object.isFrozen(actual), "Общий compiler и типы читают одну неизменяемую таблицу").toBeTrue()
  })
})
