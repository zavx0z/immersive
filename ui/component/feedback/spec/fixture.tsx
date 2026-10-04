import {Notification, StatusBar} from "@zavx0z/immersive-ui-component-feedback"

export default function ClusterExamples(props: Readonly<{label: string}>) {
  return <section>
    <section
      data-cluster-member="Notification"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Notification
        message={props.label}
      />
    </section>
    <section
      data-cluster-member="StatusBar"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <StatusBar
        start={[{id: "status", text: props.label}]}
      />
    </section>
  </section>
}
