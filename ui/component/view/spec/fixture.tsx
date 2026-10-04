import {CodeEditor, List, Table, Timeline} from "@immersive-ui-component/view"

export default function ClusterExamples(props: Readonly<{label: string}>) {
  return <section>
    <section
      data-cluster-member="CodeEditor"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <CodeEditor
        value={props.label}
        readOnly={true}
      />
    </section>
    <section
      data-cluster-member="List"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <List
        items={[{key: "one", label: props.label}]}
      />
    </section>
    <section
      data-cluster-member="Table"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Table
        columns={[{key: "name", label: props.label}]}
        rows={[{key: "one", cells: {name: props.label}}]}
      />
    </section>
    <section
      data-cluster-member="Timeline"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Timeline
        title={props.label}
        frameStart={0}
        frameEnd={100}
        frameCurrent={10}
        keyframes={[]}
      />
    </section>
  </section>
}
