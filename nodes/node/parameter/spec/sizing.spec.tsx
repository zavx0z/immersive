import {expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {ParameterNode} from "@nodes/node/parameter"
import {Typography} from "@zavx0z/ui/typography"
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
    const expanded = await headless.render(
      <ParameterNode
        id="sizing"
        label="Размер по содержимому"
        rect={{x: 16, y: 12, width: 260}}
        parameters={[parameters[0]!, {...parameters[0]!, id: "second"}]}
      />,
    )
    const bounds = expanded.getBoundingClientRect()
    expect({sameNode: expanded === first, x: bounds.x, y: bounds.y, width: bounds.width, grew: bounds.height > initial.height},
      "Родитель задаёт положение и ширину; дополнительное поле увеличивает собственную высоту ноды").toEqual({sameNode: true, x: 16, y: 12, width: 260, grew: true})
    const collapsed = await headless.render(
      <ParameterNode
        id="sizing"
        label="Размер по содержимому"
        rect={{x: 16, y: 12, width: 260}}
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
        rect={{x: 16, y: 12, width: 260}}
      >
        <Typography text="Содержимое без отдельного плана размеров" variant="title" />
      </ParameterNode>,
    )
    const bounds = node.getBoundingClientRect()
    const content = node.querySelector('[data-variant="title"]')!.getBoundingClientRect()
    expect({height: content.height > 0, contained: content.bottom <= bounds.bottom},
      "Нода охватывает реальные границы дочернего компонента").toEqual({height: true, contained: true})
  } finally { await headless.dispose() }
})
