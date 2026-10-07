import {expect, test} from "bun:test"
import {createDocument, publishVideoPlaybackState, readVideoPlaybackState} from "../../../dom/src/index.ts"
import {createDocumentRenderer} from "../src/index.ts"

test("video uses intrinsic fallback and live dimensions through normal layout/object-fit paint", () => {
  const document = createDocument()
  const root = document.createElement("div")
  const video = document.createElement("video")
  document.append(root)
  root.append(video)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 1000, height: 800}, styleSheets: ["video { object-fit: contain }"]})
  try {
    expect(renderer.flush().boxByNode.get(video)).toMatchObject({width: 300, height: 150})
    expect(renderer.flush().displayList.filter(item => item.kind === "image")).toHaveLength(0)
    publishVideoPlaybackState(video, {...readVideoPlaybackState(video), readyState: 2, videoWidth: 640, videoHeight: 480, resource: "metafor:video/test"})
    let frame = renderer.flush()
    expect(frame.boxByNode.get(video)).toMatchObject({width: 640, height: 480})
    expect(frame.displayList.find(item => item.kind === "image")).toMatchObject({src: "metafor:video/test", fit: "contain", width: 640, height: 480, node: video})
    video.width = 320
    frame = renderer.flush()
    expect(frame.boxByNode.get(video)).toMatchObject({width: 320, height: 240})
    publishVideoPlaybackState(video, {...readVideoPlaybackState(video), videoWidth: 1920, videoHeight: 1080})
    expect(renderer.flush().boxByNode.get(video)).toMatchObject({width: 320, height: 180})
    video.setAttribute("style", "display:none")
    expect(renderer.flush().displayList.filter(item => item.kind === "image")).toHaveLength(0)
  } finally { renderer.dispose() }
})
