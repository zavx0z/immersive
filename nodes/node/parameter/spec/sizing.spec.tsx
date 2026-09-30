import {expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {ParameterNode} from "@nodes/node/parameter"
import Typography from "@ui/typography"
import {parameters} from "../../spec/fixture/parameters"

test("нода определяет высоту по полям и состоянию без расчёта у вызывающего", async () => {
  const headless = createHeadless({width: 400, height: 400})
  try {
    const first = await headless.render(
      <ParameterNode
        id="sizing"
        label="Размер по содержимому"
        parameters={parameters}
      />,
    )
    const initial = first.getBoundingClientRect()
    expect(initial.width, "Компактная базовая ширина ноды").toBe(180)
    const expanded = await headless.render(
      <ParameterNode
        id="sizing"
        label="Размер по содержимому"
        rect={{x: 16, y: 12}}
        parameters={[parameters[0]!, {...parameters[0]!, id: "second"}]}
      />,
    )
    expanded.setAttribute("style", `${expanded.getAttribute("style") ?? ""};width:${"260px"}`)
    const bounds = expanded.getBoundingClientRect()
    expect({sameNode: expanded === first, x: bounds.x, y: bounds.y, width: bounds.width, grew: bounds.height > initial.height},
      "Родитель задаёт положение и ширину; дополнительное поле увеличивает собственную высоту ноды").toEqual({sameNode: true, x: 16, y: 12, width: 260, grew: true})
    const collapsed = await headless.render(
      <ParameterNode
        id="sizing"
        label="Размер по содержимому"
        rect={{x: 16, y: 12}}
        parameters={[parameters[0]!, {...parameters[0]!, id: "second"}]}
        collapsed={true}
      />,
    )
    expect(collapsed.getBoundingClientRect().height,
      "Сворачивание уменьшает высоту без передачи нового прямоугольника или внешнего плана").toBeLessThan(bounds.height)
  } finally { await headless.dispose() }
})

test("авторское содержимое входит в собственную высоту ноды", async () => {
  const headless = createHeadless({width: 400, height: 400})
  try {
    const node = await headless.render(
      <ParameterNode
        id="authored"
        label="Авторское содержимое"
        rect={{x: 16, y: 12}}
      >
        <Typography text="Содержимое без отдельного плана размеров" variant="title" />
      </ParameterNode>,
    )
    node.setAttribute("style", `${node.getAttribute("style") ?? ""};width:${"260px"}`)
    const bounds = node.getBoundingClientRect()
    const content = node.querySelector('[data-variant="title"]')!.getBoundingClientRect()
    expect({height: content.height > 0, contained: content.bottom <= bounds.bottom},
      "Нода охватывает реальные границы дочернего компонента").toEqual({height: true, contained: true})
  } finally { await headless.dispose() }
})

test("CSS управляет шириной ноды и ограничениями без props размеров", async () => {
  const headless = createHeadless({width: 400, height: 400})
  try {
    const node = await headless.render(
      <ParameterNode
        id="css-size"
        label="Короткая нода"
        parameters={parameters}
      />,
    )
    node.setAttribute("style", `${node.getAttribute("style") ?? ""};width:${"50%"}`)
    expect(node.getBoundingClientRect().width).toBe(200)
    node.setAttribute("style", `${node.getAttribute("style") ?? ""};min-width:${"240px"}`)
    expect(node.getBoundingClientRect().width).toBe(240)
    node.setAttribute("style", `${node.getAttribute("style") ?? ""};min-width:${"100px"}`)
    node.setAttribute("style", `${node.getAttribute("style") ?? ""};max-width:${"160px"}`)
    expect(node.getBoundingClientRect().width).toBe(160)
    node.setAttribute("style", `${node.getAttribute("style") ?? ""};max-width:${"none"}`)
    node.setAttribute("style", `${node.getAttribute("style") ?? ""};width:${"max-content"}`)
    const short = node.getBoundingClientRect().width
    const changed = await headless.render(
      <ParameterNode
        id="css-size"
        label="Очень длинное название ноды для проверки ширины по содержимому"
        parameters={parameters}
      />,
    )
    expect(changed).toBe(node)
    expect(changed.getBoundingClientRect().width).toBeGreaterThan(short)
  } finally { await headless.dispose() }
})
