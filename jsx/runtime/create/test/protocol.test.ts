import {expect, test} from "bun:test"
import {jsx, Fragment, jsxs} from "@zavx0z/immersive-jsx/jsx-runtime"

test("jsx/jsxs не создают runtime descriptors и требуют compiler", () => {
  for (const protocol of [jsx, jsxs]) {
    expect(() => protocol("button", {children: "Текст"})).toThrow("предварительной компиляции")
    expect(() => protocol(Fragment, {children: []})).toThrow("предварительной компиляции")
  }
})
