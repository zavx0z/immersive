import {useEffect, useState} from "@zavx0z/component"
import {ContentNode, type ContentNodeProps} from "@nodes/node/content"
import {planProjectedNodeGeometry} from "@nodes/node/geometry"
import {Counter} from "./counter"

/** Содержимое и параметры меняются независимо в пределах одной ноды. */
export function ContentFixture(props: ContentNodeProps) {
  const [collapsed, setCollapsed] = useState(props.collapsed ?? false)
  const [visible, setVisible] = useState(props.contentVisible !== false)
  const [parameters, setParameters] = useState(props.parameters ?? [])
  useEffect(() => {
    setCollapsed(props.collapsed ?? false)
    setVisible(props.contentVisible !== false)
    setParameters(props.parameters ?? [])
  }, [props.id, props.collapsed, props.contentVisible, props.parameters])
  const geometry = planProjectedNodeGeometry({id: props.id, parameters, sockets: props.sockets ?? []}, 320, undefined, undefined, {kind: "content", collapsed, contentVisible: visible})
  return <section
    aria-label="Пример ContentNode"
    style={css`
      position: relative;
      width: 352px;
      height: ${geometry.height + 32}px;
    `}
  >
    <ContentNode
      id={props.id}
      label={props.label}
      selected={props.selected}
      rect={{x: 16, y: 16, width: 320, height: geometry.height}}
      parameters={parameters}
      sockets={props.sockets}
      collapsed={collapsed}
      contentVisible={visible}
      onCollapseChange={setCollapsed}
      onContentVisibleChange={setVisible}
      onParameterInput={change => setParameters(values => values.map(value => value.id === change.parameterId ? {...value, value: change.value, revision: value.revision + 1} : value))}
    >
      <Counter id={props.id} />
    </ContentNode>
  </section>
}
