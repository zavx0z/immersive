import {Badge, Divider, Typography, Breadcrumbs, Button, TextField, MenuItem, Notification, Pane, List, WidgetHeader} from "@immersive-ui/component"

export default function ClusterExamples(props: Readonly<{label: string}>) {
  return <section>
    <section
      data-cluster-member="Badge"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Badge
        label={props.label}
      />
    </section>
    <section
      data-cluster-member="Divider"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Divider
        title={props.label}
      />
    </section>
    <section
      data-cluster-member="Typography"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Typography
        text={props.label}
      />
    </section>
    <section
      data-cluster-member="Breadcrumbs"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Breadcrumbs
        items={[{id: "one", label: props.label}]}
      />
    </section>
    <section
      data-cluster-member="Button"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <Button
        label={props.label}
      />
    </section>
    <section
      data-cluster-member="TextField"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <TextField
        value={props.label}
      />
    </section>
    <section
      data-cluster-member="MenuItem"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <MenuItem
        label={props.label}
        onSelect={() => {}}
      />
    </section>
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
