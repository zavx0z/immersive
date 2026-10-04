/**
Пример данных рамки для её сценария; не является отдельной исполняемой возможностью.

@packageDocumentation
*/
import type {ImmersiveUiComponentSurfaceFrame} from "@immersive-ui-component-surface/frame"

const frameDefaultProps: ImmersiveUiComponentSurfaceFrame.Input = Object.freeze({
  title: "Frame",
  edge: "right",
  handles: Object.freeze([
    Object.freeze({key: "move", label: "Move", disabled: false}),
    Object.freeze({key: "resize", label: "Resize", disabled: false}),
    Object.freeze({key: "dock", label: "Dock", disabled: false}),
  ]),
})

export default frameDefaultProps
