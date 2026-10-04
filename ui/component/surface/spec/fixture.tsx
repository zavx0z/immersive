import {Frame, Pane, Panel, Tab, Window, WindowControl, SurfaceTitle} from "@zavx0z/immersive-ui-component-surface"

export default function ClusterExamples(props: Readonly<{label: string}>) {
  return <section>
    <section
      data-cluster-member="Frame"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Frame
        title={props.label}
        edge="top"
        handles={[]}
      >
        {props.label}
      </Frame>
    </section>
    <section
      data-cluster-member="Pane"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Pane
        content={props.label}
      />
    </section>
    <section
      data-cluster-member="Panel"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Panel
        label={props.label}
        expanded={true}
      >
        {props.label}
      </Panel>
    </section>
    <section
      data-cluster-member="Tab"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Tab
        label={props.label}
      />
    </section>
    <section
      data-cluster-member="Window"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Window
        id="cluster-window"
        title={props.label}
        open={true}
        onOpenChange={() => {}}
      >
        {props.label}
      </Window>
    </section>
    <section
      data-cluster-member="WindowControl"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <WindowControl
        windowId="cluster-window"
        label={props.label}
        open={true}
        onOpenChange={() => {}}
      />
    </section>
    <section
      data-cluster-member="SurfaceTitle"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <SurfaceTitle
        text={props.label}
      />
    </section>
  </section>
}
