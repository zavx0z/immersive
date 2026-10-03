import Typography from "@ui/typography"
/** Frame показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Frame from "@ui-surfaces/frame"
import example from "./fixture/default-props"

describe.each([
  {name: "Основное представление", props: {title: "Область", edge: "floating", handles: []}},
  {name: "Команды рамки", props: example},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Frame
      title={props.title}
      edge={props.edge}
      handles={props.handles}
    >
      <Typography
        text="Содержимое"
      />
    </Frame>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
