import {expect, test} from "bun:test"

type Frame = {
  name: string
  hash: string
  blurPasses: number
  totalPasses: number
  freshBlurPasses: number
  maxDifference: number
  differingChannels: number
  histogram: number[]
  freshHistogram: number[]
  freshHash: string
  textRecords: string[]
  blue: number[]
  halo: number[][]
  stableForeground: boolean
}

test("нативный кэш backdrop сохраняет свежие пиксели и пропускает только неизменившиеся фильтры при обновлении переднего содержимого", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/backdrop-prefix-cache.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 60000,
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([
      worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text(),
    ])
    expect(exit, stderr).toBe(0)
    const result = JSON.parse(stdout) as {
      width: number
      height: number
      results: Frame[]
    }
    const frames = new Map(result.results.map(frame => [frame.name, frame]))
    const first = frames.get("first")!
    expect(first.blurPasses).toBe(6)
    for (const frame of result.results) {
      expect(frame.freshBlurPasses, `${frame.name}: эталон имеет новый Renderer и пустой кэш`).toBe(6)
      expect(frame.maxDifference, `${frame.name}: сохранённый результат равен свежему GPU кадру`).toBeLessThanOrEqual(2)
      expect(frame.histogram.reduce((sum, value) => sum + value, 0)).toBe(result.width * result.height)
      expect(frame.freshHistogram.reduce((sum, value) => sum + value, 0)).toBe(result.width * result.height)
      if (frame.stableForeground) {
        expect(frame.blue, `${frame.name}: ближний World сохраняет цвет`).toEqual([0, 0, 255, 255])
        for (const pixel of frame.halo) {
          expect(Math.max(...pixel.slice(0, 3)) - Math.min(...pixel.slice(0, 3)), `${frame.name}: нет синего halo за foreground`).toBeLessThanOrEqual(3)
        }
      }
    }
    for (const name of ["unchanged", "last-text", "last-shape", "resize-repeat"]) {
      expect(frames.get(name)!.blurPasses, `${name}: фоновые фильтры не менялись`).toBe(0)
    }
    expect(frames.get("last-text")!.totalPasses).toBe(3)
    expect(frames.get("last-shape")!.totalPasses).toBe(3)
    expect(frames.get("unchanged")!.hash).toBe(first.hash)
    expect(frames.get("last-text")!.hash).not.toBe(first.hash)
    expect(frames.get("last-text")!.freshHash).not.toBe(first.freshHash)
    expect(first.textRecords).toContain("Gamma")
    expect(frames.get("last-text")!.textRecords.join(" ")).toContain("Gamma running")
    expect(frames.get("last-shape")!.hash).not.toBe(frames.get("last-text")!.hash)
    for (const [name, previous] of [["earlier-text", "last-shape"], ["middle-text", "earlier-text"]] as const) {
      expect(frames.get(name)!.hash, `${name}: обновлённые глифы видны`).not.toBe(frames.get(previous)!.hash)
      expect(frames.get(name)!.freshHash, `${name}: глифы меняют также новый Renderer`).not.toBe(frames.get(previous)!.freshHash)
    }
    expect(frames.get("earlier-text")!.blurPasses, "первая панель стабильна, две последующие зависят от её текста").toBe(4)
    expect(frames.get("middle-text")!.blurPasses, "только последняя панель зависит от текста средней").toBe(2)
    expect(frames.get("sigma")!.blurPasses, "новая sigma меняет средний фильтр и фон следующего").toBe(4)
    for (const name of ["world", "camera", "resize"]) {
      expect(frames.get(name)!.blurPasses, `${name}: весь источник backdrop изменился`).toBe(6)
    }
    expect(frames.get("clip")!.blurPasses).toBeGreaterThanOrEqual(4)
    expect(frames.get("clip")!.blurPasses).toBeLessThanOrEqual(6)
    expect(frames.get("resize-repeat")!.hash).toBe(frames.get("resize")!.hash)
  } finally {
    if (worker.exitCode === null) {
      worker.kill()
    }
    await worker.exited
  }
}, 65000)
