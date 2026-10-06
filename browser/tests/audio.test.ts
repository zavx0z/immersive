import {expect, test} from "bun:test"
import {createAudioPlayback, type AudioPlaybackState} from "../audio"

test("native audio IO публикует состояние, seek и dispose освобождают playback без visible DOM", async () => {
  const events = new Map<string, () => void>()
  const states: AudioPlaybackState[] = []
  let loads = 0
  let removed = 0
  const audio = {paused: true, ended: false, duration: 20, currentTime: 0, src: "", preload: "",
    addEventListener(name: string, callback: () => void) {events.set(name, callback)},
    removeEventListener(name: string) {events.delete(name)},
    load() {loads++}, removeAttribute() {removed++},
    async play() {this.paused = false; events.get("play")?.()},
    pause() {this.paused = true; events.get("pause")?.()},
  }
  const native = {createElement(name: string) {expect(name).toBe("audio"); return audio}}
  const player = createAudioPlayback(new Blob([new Uint8Array([1])]), {document: native as unknown as Document, onChange: state => states.push(state)})
  expect(audio.src).toStartWith("blob:")
  await player.play()
  expect(states.at(-1)?.playing).toBe(true)
  player.seek(100)
  expect(audio.currentTime).toBe(20)
  player.pause()
  expect(states.at(-1)?.playing).toBe(false)
  player.dispose()
  player.dispose()
  expect(events.size).toBe(0)
  expect(loads).toBe(2)
  expect(removed).toBe(1)
  await expect(player.play()).rejects.toThrow("закрыто")
})
