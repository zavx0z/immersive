import {Editor, Inspector, Terminal, Tree, WidgetHeader} from "@zavx0z/immersive-ui-component-widget"

export default function ClusterExamples(props: Readonly<{label: string}>) {
  return <section>
    <section
      data-cluster-member="Editor"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Editor
        title={props.label}
        value={props.label}
        readOnly={true}
      />
    </section>
    <section
      data-cluster-member="Inspector"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Inspector
        categories={[{id: "one", label: props.label}]}
        selectedCategoryId="one"
        query=""
      >
        {props.label}
      </Inspector>
    </section>
    <section
      data-cluster-member="Terminal"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Terminal
        title={props.label}
        input=""
        lines={[]}
      />
    </section>
    <section
      data-cluster-member="Tree"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Tree
        title={props.label}
        items={[{id: "one", label: props.label}]}
        expandedKeys={[]}
        selectedKeys={[]}
      />
    </section>
    <section
      data-cluster-member="WidgetHeader"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <WidgetHeader
        title={props.label}
      />
    </section>
  </section>
}
