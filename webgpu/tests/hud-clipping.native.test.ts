import {expect, test} from "bun:test"

/** Native GPU проверяет production composition, frustum, uniform и реальные pixels. */
test("HUD pixels не зависят от near/far Space, но мировая геометрия продолжает отсекаться", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/hud-clipping.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 25000,
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([
      worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text(),
    ])
    expect(exit, stderr).toBe(0)
    const frames = JSON.parse(stdout) as {near: number; far: number; hudPixels: number[]; secondHud: number[]; center: number[]; raster: boolean}[]
    expect(frames).toHaveLength(3)
    const reference = frames[0]!
    expect(reference.hudPixels.length).toBe(40 * 16 * 4)
    for (let index = 0; index < reference.hudPixels.length; index += 4) {
      expect(reference.hudPixels.slice(index, index + 4)).toEqual([0, 255, 0, 255])
    }
    expect(frames[1]!.hudPixels).toEqual(reference.hudPixels)
    expect(frames[2]!.hudPixels).toEqual(reference.hudPixels)
    for (const frame of frames) expect(frame.secondHud).toEqual([255, 255, 0, 255])
    expect(reference.raster, "В том же кадре есть raster Display с собственным uniform slot").toBe(true)
    expect(reference.center, "Ближайшая красная world-плоскость видна с широким clip range").toEqual([255, 0, 0, 255])
    expect(frames[1]!.center, "far=100 продолжает отсекать обе world-плоскости").toEqual([0, 0, 0, 255])
    expect(frames[2]!.center, "near=10000 отсекает красную плоскость, сохраняя синюю на глубине20000").toEqual([0, 0, 255, 255])
  } finally {
    if (worker.exitCode === null) worker.kill()
    await worker.exited
  }
}, 30000)
