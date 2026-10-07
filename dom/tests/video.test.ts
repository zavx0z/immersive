import {expect, test} from "bun:test"
import {createDocument, HTMLVideoElement, bindVideoPlayback, publishVideoPlaybackState, readVideoPlaybackState} from "../src/index.ts"

test("video factory, stream identity, reflected dimensions and independent mute state", () => {
  const video = createDocument().createElement("video")
  expect(video).toBeInstanceOf(HTMLVideoElement)
  const stream = {getTracks() { return [] }}
  video.srcObject = stream
  expect(video.srcObject).toBe(stream)
  video.width = 640
  video.height = 360
  video.autoplay = true
  video.playsInline = true
  video.defaultMuted = true
  video.muted = false
  expect(video.getAttribute("width")).toBe("640")
  expect(video.defaultMuted).toBeTrue()
  expect(video.muted).toBeFalse()
  expect(video.getAttribute("playsinline")).toBe("")
  expect(video.paused).toBeTrue()
  expect(video.readyState).toBe(0)
  expect(video.error).toBeNull()
})

test("play before Browser attachment waits for native play and source disposal rejects pending playback", async () => {
  const video = createDocument().createElement("video")
  const pending = video.play()
  let playing = 0
  let complete = (): void => {}
  const nativePlay = new Promise<void>(resolve => { complete = resolve })
  const unbind = bindVideoPlayback(video, {
    play() {
      playing++
      return nativePlay
    },
    pause() {},
  })
  await Bun.sleep(0)
  expect(playing).toBe(1)
  publishVideoPlaybackState(video, {...readVideoPlaybackState(video), paused: false, readyState: 4, videoWidth: 800, videoHeight: 600, resource: "metafor:test"})
  complete()
  await pending
  expect(video.paused).toBeFalse()
  expect(video.videoWidth).toBe(800)
  const next = video.play()
  unbind()
  await expect(next).rejects.toMatchObject({name: "AbortError"})
  expect(video.readyState).toBe(0)
  expect(video.videoWidth).toBe(0)
})

test("native rejection is delivered to the caller and pause cancels queued play", async () => {
  const video = createDocument().createElement("video")
  const error = Object.assign(new Error("gesture needed"), {name: "NotAllowedError"})
  const unbind = bindVideoPlayback(video, {async play() { throw error }, pause() {}})
  await expect(video.play()).rejects.toBe(error)
  unbind()
  const pending = video.play()
  video.pause()
  await expect(pending).rejects.toMatchObject({name: "AbortError"})
})

test("detach cancels in-flight native play even when decoder promise has not settled", async () => {
  const video = createDocument().createElement("video")
  const unbind = bindVideoPlayback(video, {play: () => new Promise<void>(() => {}), pause() {}})
  const pending = video.play()
  await Bun.sleep(0)
  unbind()
  await expect(pending).rejects.toMatchObject({name: "AbortError"})
})
