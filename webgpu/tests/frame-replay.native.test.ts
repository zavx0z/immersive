import {expect, test} from "bun:test"

test("повтор кадров сравнивает реальные GPU-входы и замечает изменение содержимого той же текстуры", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/frame-replay.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 30000,
  })
  const [exit, stdout, stderr] = await Promise.all([worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text()])
  expect(exit, stderr).toBe(0)
  const result = JSON.parse(stdout) as {
    sameImageTexture: boolean
    results: {
      name: string
      passes: number
      hash: string
      pixel: number[]
    }[]
  }
  const frames = new Map(result.results.map(frame => [frame.name, frame]))
  expect(frames.get("first")!.passes).toBeGreaterThan(0)
  expect(frames.get("unchanged")!.passes).toBe(0)
  expect(frames.get("unchanged")!.hash).toBe(frames.get("first")!.hash)
  for (const name of ["material", "light", "camera", "geometry", "text", "clip", "sigma", "visibility", "background", "image-replaced", "invalidated"]) {
    expect(frames.get(name)!.passes, name).toBeGreaterThan(0)
    expect(frames.get(`${name}-repeat`)!.passes, name).toBe(0)
    expect(frames.get(`${name}-repeat`)!.hash, name).toBe(frames.get(name)!.hash)
  }
  expect(frames.get("image-repeat")!.passes).toBe(0)
  expect(frames.get("image-repeat")!.pixel).toEqual([255, 0, 0, 255])
  expect(frames.get("image-replaced")!.pixel).toEqual([0, 255, 0, 255])
  expect(result.sameImageTexture).toBe(true)
  expect(frames.get("material")!.hash).not.toBe(frames.get("first")!.hash)
  expect(frames.get("light")!.hash).not.toBe(frames.get("material")!.hash)
  expect(frames.get("text")!.hash).not.toBe(frames.get("geometry")!.hash)
  expect(frames.get("clip")!.hash).not.toBe(frames.get("text")!.hash)
}, 35000)
