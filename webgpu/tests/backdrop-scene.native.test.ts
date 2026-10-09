import {expect, test} from "bun:test"

type Probe = {
  intendedRasterSize: {width: number, height: number}
  resizedRasterSize: {width: number, height: number}
  candidateFootprint: number
  frames: Record<string, Record<string, number[]>>
  edgeProfile: number[]
  childReused: boolean
  moveReused: boolean
  rootReused: boolean
  noneCleared: boolean
  disposeCleared: boolean
}

test("native Display backdrop размывает внешний World за поверхностью, сохраняя передний World", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/backdrop-scene.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 25000,
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([
      worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text(),
    ])
    expect(exit, stderr).toBe(0)
    const result = JSON.parse(stdout) as Record<"lowDpi" | "highDpi", Probe>
    expect(result.lowDpi.intendedRasterSize).toEqual({width: 200, height: 120})
    expect(result.lowDpi.candidateFootprint).toBe(3)
    expect(result.highDpi.intendedRasterSize).toEqual({width: 600, height: 360})
    expect(result.highDpi.candidateFootprint).toBe(1)
    for (const [mode, probe] of Object.entries(result)) {
      const {frames} = probe
      expect(probe.edgeProfile.length).toBe(17)
      expect(probe.edgeProfile.slice(1).every((value, index) => value < probe.edgeProfile[index]!),
        `${mode}: Gaussian edge stays smooth instead of discrete gray bands`).toBeTrue()
      const none = frames.none!, blurred = frames.blurred!, foreground = frames.foreground!
      expect(none.insideWhite![0], mode).toBeGreaterThan(245)
      expect(none.insideBlack![0], mode).toBeLessThan(10)
      expect(blurred.insideWhite![0], `${mode}: белый World размывается`).toBeLessThan(none.insideWhite![0]! - 20)
      expect(blurred.insideBlack![0], `${mode}: чёрный World размывается`).toBeGreaterThan(none.insideBlack![0]! + 20)
      for (const key of ["outsideWhite", "outsideBlack", "corner"] as const) {
        for (let channel = 0; channel < 4; channel++) {
          expect(Math.abs(blurred[key]![channel]! - none[key]![channel]!), `${mode}/${key}`).toBeLessThanOrEqual(3)
        }
      }
      expect(blurred.child, `${mode}: UI child остаётся резким`).toEqual([0, 255, 0, 255])
      expect(Math.abs(blurred.childOutside![0]! - blurred.childOutside![1]!), mode).toBeLessThanOrEqual(3)
      for (const name of ["foreground", "foregroundNone", "reblurred", "dynamic"] as const) {
        expect(frames[name]!.blue, `${mode}/${name}: ближний синий World`).toEqual([0, 0, 255, 255])
        expect(frames[name]!.red, `${mode}/${name}: ближний красный World`).toEqual([255, 0, 0, 255])
      }
      for (const key of ["blueOutside", "redOutside"] as const) {
        const pixel = foreground[key]!
        expect(Math.abs(pixel[0]! - pixel[1]!), `${mode}/${key}: нет красного halo`).toBeLessThanOrEqual(3)
        expect(Math.abs(pixel[2]! - pixel[1]!), `${mode}/${key}: нет синего halo`).toBeLessThanOrEqual(3)
        expect(pixel[3]).toBe(255)
      }
      expect(frames.reblurred, `${mode}: повторный blur не использует старый raster`).toEqual(foreground)
      expect(frames.dynamic!.insideWhite![0], mode).toBeLessThan(blurred.insideWhite![0]! - 40)
      expect(frames.dynamicNone!.insideWhite![0], mode).toBeLessThan(10)
      expect(frames.dynamicNone!.insideBlack![0], mode).toBeGreaterThan(245)
      expect(frames.moved!.insideBlack![0], mode).toBeGreaterThan(20)
      expect(frames.resized!.insideWhite![0], mode).toBeLessThan(230)
      expect(frames.resized!.insideBlack![0], mode).toBeGreaterThan(20)
      for (const value of Object.values(frames.released!)) expect(value, `${mode}: release не сохраняет старую сцену`).toEqual([255, 0, 255, 255])
      for (const value of Object.values(frames.empty!)) expect(value, `${mode}: удалённый World не остаётся в blur`).toEqual([0, 0, 0, 255])
      expect(probe.childReused, mode).toBe(true)
      expect(probe.moveReused, mode).toBe(true)
      expect(probe.rootReused, mode).toBe(true)
      expect(probe.noneCleared, mode).toBe(true)
      expect(probe.disposeCleared, mode).toBe(true)
    }
  } finally {
    if (worker.exitCode === null) worker.kill()
    await worker.exited
  }
}, 30000)
