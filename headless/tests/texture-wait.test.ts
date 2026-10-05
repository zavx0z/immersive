import {expect, test} from "bun:test"
import type {TextureEntry} from "@zavx0z/immersive-webgpu"
import waitForTexture from "../wait-for-texture.ts"

const device = {} as GPUDevice
function fixture() {
  let changed = () => {}
  let released = 0
  let acquired = 0
  let state: TextureEntry = {src: "image.png", status: "loading", width: 1, height: 1, texture: null, error: null}
  const input = {device, acquire(callback: () => void) {
    acquired += 1
    changed = callback
    return {
      load() { return state }, peek() { return state }, release() { released += 1 },
    }
  }}
  return {input, released: () => released, acquired: () => acquired, finish(status: "ready" | "failed") { state = {...state, status, error: status === "failed" ? "decode failed" : null}; changed() }}
}

test("transient wait освобождает lease при ready и failure, повторный callback безопасен", async () => {
  const ready = fixture()
  const result = waitForTexture({...ready.input, signal: new AbortController().signal})
  ready.finish("ready")
  ready.finish("ready")
  await result
  expect(ready.released()).toBe(1)
  const failed = fixture()
  const rejection = waitForTexture({...failed.input, signal: new AbortController().signal})
  failed.finish("failed")
  await expect(rejection).rejects.toThrow("Headless не смог загрузить изображение")
  expect(failed.released()).toBe(1)
})

test("отмена собственного pending wait не отменяет peer; pre-aborted wait ничего не приобретает", async () => {
  const first = fixture()
  const peer = fixture()
  const abort = new AbortController()
  const own = waitForTexture({...first.input, signal: abort.signal})
  const other = waitForTexture({...peer.input, signal: new AbortController().signal})
  abort.abort(new Error("Удалён владелец"))
  await expect(own).rejects.toThrow("Удалён владелец")
  expect(first.released()).toBe(1)
  expect(peer.released()).toBe(0)
  peer.finish("ready")
  await other
  expect(peer.released()).toBe(1)
  const cancelled = fixture()
  await expect(waitForTexture({...cancelled.input, signal: abort.signal})).rejects.toThrow("Удалён владелец")
  expect(cancelled.acquired()).toBe(0)
})


test("отмена во время acquire освобождает полученный lease до load", async () => {
  const abort = new AbortController()
  let released = 0
  let loads = 0
  const result = waitForTexture({device, signal: abort.signal, acquire() {
    abort.abort(new Error("Кадр изменился"))
    return {load() {
      loads += 1
      throw new Error("load после отмены недопустим")
    }, peek() { return undefined }, release() { released += 1 }}
  }})
  await expect(result).rejects.toThrow("Кадр изменился")
  expect(released).toBe(1)
  expect(loads).toBe(0)
})
