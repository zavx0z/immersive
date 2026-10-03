/**
Пример кадров и маркеров для сценария временной шкалы.

@packageDocumentation
*/
import type {UiViewsTimeline} from "@ui-views/timeline"

const timelineDefaultProps: UiViewsTimeline.Input = Object.freeze({
  title: "Timeline",
  frameStart: 1,
  frameEnd: 100,
  frameCurrent: 50,
  keyframes: Object.freeze([
    Object.freeze({key: "start", frame: 10, label: "Keyframe 10"}),
    Object.freeze({key: "current", frame: 50, label: "Keyframe 50", selected: true}),
    Object.freeze({key: "end", frame: 90, label: "Keyframe 90"})
  ]),
  markers: Object.freeze([
    Object.freeze({key: "review", frame: 75, label: "Review"})
  ])
})

export default timelineDefaultProps
