/** Виджеты составляют одну панель в Document принимающего приложения. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Panel from "@zavx0z/immersive-ui-component-surface-panel"
import {Editor, Inspector, Settings, Terminal, Tree, WidgetHeader} from "@zavx0z/immersive-ui-component-widget"

describe.each([
  {name: "Исходные данные", props: {label: "Пример"}},
  {name: "Другие данные", props: {label: "Изменённый пример"}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 800, height: 1600})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Panel label="Виджеты" expanded={true}>
      <Editor title={props.label} value={props.label} readOnly={true} />
      <Inspector
        ariaLabel="Категории примера"
        categories={[{id: "one", label: props.label}]}
        selectedCategoryId="one"
        query=""
      >
        {props.label}
      </Inspector>
      <Terminal title={props.label} input="" lines={[]} />
      <Tree
        title={props.label}
        items={[{id: "one", label: props.label}]}
        expandedKeys={[]}
        selectedKeys={[]}
      />
      <Settings
        sections={[{id: "one", label: props.label}]}
        selectedId="one"
      >
        {props.label}
      </Settings>
      <WidgetHeader title="Общий заголовок" />
    </Panel>
  )

  test("Состав панели", () => {
    expect([...element.querySelectorAll("[data-widget]")].map(node => node.getAttribute("data-widget")),
      "Редактор, терминал, дерево и настройки сохраняют собственные представления").toEqual(["editor", "terminal", "tree", "settings"])
    expect(element.querySelector('[aria-label="Категории примера"]')?.textContent,
      "Инспектор размещает переданное содержимое в своей панели").toContain(props.label)
    expect([...element.querySelectorAll("header")].some(header => header.textContent === "Общий заголовок"),
      "Общий заголовок доступен как самостоятельный участник").toBeTrue()
  })

  test("Общий Document", () => {
    expect([...element.querySelectorAll("*")].every(node => node.ownerDocument === element.ownerDocument),
      "Все виджеты принадлежат Document принимающего приложения").toBeTrue()
    expect(element.querySelectorAll("canvas"), "Виджеты не создают отдельные Canvas").toHaveLength(0)
  })
})
