import {SurfaceOwner, SurfaceTitle, SurfaceBody, SurfaceNavigation, SurfaceButton, SurfaceHeader} from "@immersive-ui-component-surface/chrome"

export default function ClusterExamples(props: Readonly<{label: string}>) {
  return <section>
    <section
      data-cluster-member="SurfaceOwner"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <SurfaceOwner
        label={props.label}
      >
        {props.label}
      </SurfaceOwner>
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
    <section
      data-cluster-member="SurfaceBody"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <SurfaceBody>
        {props.label}
      </SurfaceBody>
    </section>
    <section
      data-cluster-member="SurfaceNavigation"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <SurfaceNavigation
        label={props.label}
      >
        {props.label}
      </SurfaceNavigation>
    </section>
    <section
      data-cluster-member="SurfaceButton"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <SurfaceButton
        label={props.label}
      />
    </section>
    <section
      data-cluster-member="SurfaceHeader"
      style={css`
        position: relative;
        min-height: 40px;
        width: 600px;
      `}
    >
      <SurfaceHeader>
        {props.label}
      </SurfaceHeader>
    </section>
  </section>
}
