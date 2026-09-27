import {useEffect, useState} from "@zavx0z/component"
import {ParameterNode, type ParameterNodeProps} from "@nodes/node/parameter"
import {planProjectedNodeGeometry} from "@nodes/node/geometry"

/** Нода получает изменения из своего примера; параметры и состояние доступны для взаимодействия. */
export function ParameterFixture(props: ParameterNodeProps) {
  const [collapsed, setCollapsed] = useState(props.collapsed ?? false)
  const [parameters, setParameters] = useState(props.parameters ?? [])
  useEffect(() => {
    setCollapsed(props.collapsed ?? false)
    setParameters(props.parameters ?? [])
  }, [props.id, props.collapsed, props.parameters])
  const geometry = planProjectedNodeGeometry({id: props.id, parameters, sockets: props.sockets ?? []}, 320, undefined, undefined, {collapsed})
  return <section
    aria-label="Пример ParameterNode"
    style={css`
      position: relative;
      width: 352px;
      height: ${geometry.height + 80}px;
    `}
  >
    <ParameterNode
      id={props.id}
      label={props.label}
      selected={props.selected}
      rect={{x: 16, y: 16, width: 320, height: geometry.height}}
      parameters={parameters}
      sockets={props.sockets}
      collapsed={collapsed}
      onCollapseChange={setCollapsed}
      onParameterInput={change => setParameters(values => values.map(value => value.id === change.parameterId ? {...value, value: change.value, revision: value.revision + 1} : value))}
      onParameterChange={change => setParameters(values => values.map(value => value.id === change.parameterId ? {...value, value: change.value, revision: value.revision + 1} : value))}
    />
  </section>
}
