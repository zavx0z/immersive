/** Table показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Table from "@immersive-ui-component-view/table"

describe.each([{name: "Основное представление", props: {columns: [{key: "name", label: "Название"}], rows: [{key: "a", cells: {name: "Первый"}}]}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Table
      columns={props.columns}
      rows={props.rows}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Первый")
  })
})
