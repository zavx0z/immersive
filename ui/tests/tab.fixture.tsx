import {useState} from "@zavx0z/component"
import {TabContent} from "../surface/tab/spec/fixture/src/content.tsx"
import Tab from "@ui-surfaces/tab"
import type {TabProps} from "@ui-surfaces/tab"

/** Дочерняя кнопка сохраняет собственное состояние и ввод внутри перемещаемого таба. */
export function TabChildrenFixture(props: Pick<TabProps, "position">) {
  const [count, setCount] = useState(0)
  return <Tab
    position={props.position}
  >
    <TabContent
      count={count}
      onIncrement={() => setCount(count + 1)}
    />
  </Tab>
}

/** Воспроизведение отсутствующего вертикального writing-mode в Renderer. */
export function TabVerticalLabelFixture() {
  return <Tab
    label="Вертикальная подпись"
    position={{edge: "left", offset: .5}}
    style={css`
      writing-mode: vertical-rl;
      text-orientation: sideways;
    `}
  />
}
