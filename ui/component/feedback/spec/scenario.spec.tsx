/** Участники группы создают настоящие элементы одного принимающего Document. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import ClusterExamples from "./fixture"

describe.each([
  {name: "Исходные данные", props: {label: "Пример"}},
  {name: "Другие данные", props: {label: "Изменённый пример"}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 800, height: 1600})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ClusterExamples
      label={props.label}
    />
  )
  test("Общее представление", () => {
    const members = [...element.querySelectorAll("[data-cluster-member]")]
    expect(members, "Все выбранные самостоятельные участники представлены").toHaveLength(2)
    expect(members.filter(member => !member.firstElementChild).map(member => member.getAttribute("data-cluster-member")),
      "Каждый JSX-результат создаёт собственное представление").toEqual([])
    expect(members.flatMap(member => [...member.querySelectorAll("*")]).every(node => node.ownerDocument === element.ownerDocument),
      "Все представления используют Document принимающего приложения").toBeTrue()
    expect(element.querySelectorAll("canvas"), "Участники не создают отдельные Canvas").toHaveLength(0)
  })
})
