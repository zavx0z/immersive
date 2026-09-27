import {useEffect, useState} from "@zavx0z/component"
import {ParameterNodeContents, type ParameterNodeContentsProps} from "@nodes/node/contents"
import {visibilityOnIcon} from "@zavx0z/ui/themes/icons"
import {Pane} from "@zavx0z/ui/surfaces/pane"

/** Отдельный просмотр составной части ноды с её шапкой, полями, сокетами и действием. */
export function ContentsFixture(props: ParameterNodeContentsProps & {action?: boolean | undefined}) {
  const [count, setCount] = useState(0)
  useEffect(() => setCount(0), [props.id])
  return <section
    aria-label="Содержимое ноды"
    style={css`
      box-sizing: border-box;
      width: 320px;
      --node-header-height: ${props.headerHeight}px;
    `}
  >
    <Pane
      style={css`
        padding: 0;
        overflow: visible;
        border-radius: 6px;
        background: #303030;
        box-shadow: 0 0 12px rgba(0, 0, 0, .5);
      `}
    >
      <ParameterNodeContents
        id={props.id}
        label={props.label}
        category={props.category}
        headerHeight={props.headerHeight}
        parameters={props.parameters}
        sockets={props.sockets}
        actions={props.action ? [{id: "inspect", label: "Проверить действие", iconSrc: visibilityOnIcon, onClick: () => setCount(value => value + 1)}] : []}
      />
    </Pane>
    <output
      aria-label="Выполнено действий"
      hidden={!props.action}
      style={css`
        &[hidden] {
          display: none;
        }
      `}
    >{String(count)}</output>
  </section>
}
