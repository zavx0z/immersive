import {expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import CollectionField from "@zavx0z/immersive-ui-component-field-collection"

test("содержимое помещается в заданную ширину независимо от подписи", async () => {
  const headless = createHeadless({width: 400, height: 240})
  try {
    for (const label of [undefined, "Значение", "Очень длинная подпись поля"]) {
      const field = await headless.render(
        <CollectionField
          label={label}
          items={[{id: "one", label: "Один"}]}
          selectedId="one"
        />,
      )
      if (label === undefined) expect(field.getBoundingClientRect().width).toBe(320)
      field.setAttribute("style", "width: 140px")
      await headless.capture(field)
      const bounds = field.getBoundingClientRect()
      const content = field.querySelector("div")!.getBoundingClientRect()
      expect(bounds.width).toBe(140)
      expect(content.width).toBeGreaterThan(0)
      expect(content.left).toBeGreaterThanOrEqual(bounds.left)
      expect(content.right).toBeLessThanOrEqual(bounds.right)
    }
  } finally {
    await headless.dispose()
  }
}, 30_000)
