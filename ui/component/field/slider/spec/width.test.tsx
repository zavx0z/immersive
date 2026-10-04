import {expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import SliderField from "@zavx0z/immersive-ui-component-field-slider"

test("содержимое помещается в заданную ширину независимо от подписи", async () => {
  const headless = createHeadless({width: 400, height: 240})
  try {
    for (const label of [undefined, "Значение", "Очень длинная подпись поля"]) {
      const field = await headless.render(
        <SliderField
          label={label}
          value={0.5}
          min={0}
          max={1}
        />,
      )
      if (label === undefined) expect(field.getBoundingClientRect().width).toBe(180)
      field.setAttribute("style", "width: 140px")
      await headless.capture(field)
      const bounds = field.getBoundingClientRect()
      const content = field.querySelector("input")!.getBoundingClientRect()
      expect(bounds.width).toBe(140)
      expect(content.width).toBeGreaterThan(0)
      expect(content.left).toBeGreaterThanOrEqual(bounds.left)
      expect(content.right).toBeLessThanOrEqual(bounds.right)
    }
  } finally {
    await headless.dispose()
  }
}, 30_000)
