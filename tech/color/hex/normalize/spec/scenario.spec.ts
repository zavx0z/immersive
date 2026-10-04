/** normalizeHexColor показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@zavx0z/immersive-tech-color-hex-normalize"

describe.each([{name: "Публичный вызов", props: {args: ["#ABC"] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe("#aabbcc")
  })
})
