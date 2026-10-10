import {expect, test} from "bun:test"
import {Event} from "@zavx0z/immersive-dom"
import {createHeadless} from "@zavx0z/immersive-headless"
import {EmptyFragment, FragmentCounter, SingleFragment, TextFragment} from "./fixtures/fragments.tsx"

test("Headless показывает stateful фрагмент в существующем host без лишнего корня компонента", async () => {
  const headless = createHeadless({width: 240, height: 80})
  let cleanups = 0
  try {
    const host = await headless.render(
      <FragmentCounter cleanup={() => { cleanups++ }} />,
    )
    expect(host.children.map(element => element.localName)).toEqual(["button", "span"])
    const button = host.querySelector("button")!
    button.dispatchEvent(new Event("click", {bubbles: true}))
    const frame = await headless.capture(host)
    expect(host.querySelector("button") === button).toBeTrue()
    expect(button.textContent).toBe("1")
    expect([frame.width, frame.height]).toEqual([240, 80])
    expect(frame.rgba.some((value, index) => index % 4 === 3 && value > 0)).toBeTrue()
    expect(cleanups).toBe(0)
  } finally { await headless.dispose() }
  expect(cleanups).toBe(1)
}, 60_000)

test("Headless принимает текстовый и пустой результат без authored wrapper", async () => {
  const headless = createHeadless({width: 240, height: 80})
  try {
    const host = await headless.render(<TextFragment />)
    expect(host.children).toHaveLength(0)
    expect(host.textContent).toBe("Текст без элемента")
    const empty = await headless.render(<EmptyFragment />)
    expect(empty === host).toBeTrue()
    expect(empty.children).toHaveLength(0)
    expect(empty.textContent).toBe("")
    expect((await headless.capture(empty)).png.byteLength).toBeGreaterThan(0)
    const single = await headless.render(<SingleFragment />)
    expect(single.localName).toBe("button")
    expect(single.hasAttribute("data-single")).toBeTrue()
  } finally { await headless.dispose() }
}, 60_000)
