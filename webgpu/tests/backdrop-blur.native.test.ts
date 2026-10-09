import {expect, test} from "bun:test"

type Samples = Record<string, number[]>
type Probe = {
  frames: Record<string, Samples>
  rasterSelected: boolean
  resizedRasterSelected: boolean
  noneCleared: boolean
  moveReused: boolean
  disposeCleared: boolean
  released: number[]
}

test("native CSS backdrop: HUD, прямой и raster Display размывают только предыдущее содержимое", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/backdrop-blur.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 25000,
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([
      worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text(),
    ])
    expect(exit, stderr).toBe(0)
    const modes = JSON.parse(stdout) as Record<"hud" | "raster" | "direct", Probe>
    for (const [mode, result] of Object.entries(modes)) {
      const {frames} = result
      const zero = frames.zero!, blurred = frames.blurred!
      expect(zero.insideWhite![0], mode).toBeGreaterThan(230)
      expect(zero.insideBlack![0], mode).toBeLessThan(25)
      expect(blurred.insideWhite![0], mode).toBeLessThan(zero.insideWhite![0]! - 20)
      expect(blurred.insideBlack![0], mode).toBeGreaterThan(zero.insideBlack![0]! + 20)
      expect(blurred.insideWhite![0], mode).toBeGreaterThan(blurred.insideBlack![0]!)
      for (const key of ["outsideWhite", "outsideBlack", "corner"] as const) {
        for (let channel = 0; channel < 4; channel++) {
          expect(Math.abs(blurred[key]![channel]! - zero[key]![channel]!), `${mode}/${key}`).toBeLessThanOrEqual(3)
        }
      }
      for (const key of ["foreground", "foregroundRight"] as const) {
        expect(blurred[key]![0], mode).toBeGreaterThan(245)
        expect(blurred[key]![1], mode).toBeLessThan(10)
        expect(blurred[key]![2], mode).toBeLessThan(10)
      }
      const outside = blurred.foregroundOutside!
      expect(Math.abs(outside[0]! - outside[1]!), `${mode}: передний child не входит в собственный blur`).toBeLessThanOrEqual(3)
      expect(frames.none, `${mode}: none равен blur(0)`).toEqual(zero)
      expect(frames.opacityZero, `${mode}: opacity:0 равен отсутствующей панели`).toEqual(frames.hidden)
      const overlapZero = frames.overlapZero!.overlap!, overlap = frames.overlapBlurred!.overlap!
      expect(Math.abs(overlapZero[0]! - overlapZero[1]!), mode).toBeLessThanOrEqual(3)
      expect(overlap[0]! - overlap[1]!, `${mode}: следующая панель учитывает красный child предыдущей`).toBeGreaterThan(15)
      expect(frames.moved!.insideBlack![0], mode).toBeGreaterThan(frames.movedZero!.insideBlack![0]! + 20)
      expect(frames.resized!.insideWhite![0], mode).toBeLessThan(230)
      expect(frames.resized!.insideBlack![0], mode).toBeGreaterThan(25)
      if (mode === "hud") {
        const alpha = frames.alphaBlur!.insideBlack!
        expect(alpha[3]).toBeGreaterThan(10)
        expect(alpha[3]).toBeLessThan(180)
        for (let channel = 0; channel < 3; channel++) {
          expect(Math.abs(alpha[channel]! - alpha[3]!), "premultiplied white keeps RGB equal to alpha").toBeLessThanOrEqual(3)
        }
      }
      expect(result.rasterSelected, mode).toBe(true)
      expect(result.resizedRasterSelected, mode).toBe(true)
      expect(result.noneCleared, mode).toBe(true)
      expect(result.moveReused, mode).toBe(true)
      expect(result.disposeCleared, mode).toBe(true)
      expect(result.released, mode).toEqual([0, 0, 0, 255])
    }
  } finally {
    if (worker.exitCode === null) worker.kill()
    await worker.exited
  }
}, 30000)
