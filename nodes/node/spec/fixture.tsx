import {DiagramNode, ParameterNode, ContentNode} from "@nodes/node"
import Typography from "@ui/typography"

export default function NodeExamples(props: Readonly<{selected: boolean, hidden: boolean}>) {
  return <section>
    <DiagramNode
      id="diagram"
      description="Описание диаграммы"
      selected={props.selected}
      hidden={props.hidden}
    />
    <ParameterNode
      id="parameter"
      label="Параметры"
      selected={props.selected}
      hidden={props.hidden}
      parameters={[]}
      sockets={[]}
    />
    <ContentNode
      id="content"
      label="Содержимое"
      selected={props.selected}
      hidden={props.hidden}
      parameters={[]}
      sockets={[]}
    >
      <Typography
        text="Авторское содержимое"
      />
    </ContentNode>
  </section>
}
