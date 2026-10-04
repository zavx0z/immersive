import {describe, expect, test} from "bun:test"
import JsxCompileError from "@immersive-jsx-compiler/error"

describe.each([
  {name: "Ошибка компонента", props: {message: "Неизвестный слот", sourcePath: "/app/panel.tsx"}},
  {name: "Ошибка сценария", props: {message: "children запрещён", sourcePath: "/app/spec/example.tsx"}},
])("$name", ({props}) => {
  const actual = new JsxCompileError(props.message, props.sourcePath)
  test("Источник и причина", () => {
    expect({name: actual.name, message: actual.message, sourcePath: actual.sourcePath}, "Стандартная ошибка сохраняет причину вместе с файлом для отчёта сборки").toEqual({name: "JsxCompileError", message: `${props.sourcePath}: ${props.message}`, sourcePath: props.sourcePath})
  })
})
