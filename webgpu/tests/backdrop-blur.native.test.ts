import {expect, test} from "bun:test"

type Samples = Record<string, number[]>
type Probe = {
  cornerProfiles: Record<string, number[]>
  forcedPortable: boolean
  adapterSupportsDualSource: boolean
  deviceFeatures: string[]
  frames: Record<string, Samples>
  rasterCandidateCreated: boolean
  noneCleared: boolean
  moveReused: boolean
  disposeCleared: boolean
  released: number[]
}

type Modes = Record<"hud" | "lowDpi" | "direct", Probe>

async function capture(forcedPortable: boolean): Promise<Modes> {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/backdrop-blur.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 45000,
    env: {...process.env, BACKDROP_DISABLE_DUAL_SOURCE: forcedPortable ? "1" : "0"},
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([
      worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text(),
    ])
    expect(exit, stderr).toBe(0)
    return JSON.parse(stdout) as Modes
  } finally {
    if (worker.exitCode === null) worker.kill()
    await worker.exited
  }
}

test("native CSS backdrop: HUD и Display разной номинальной плотности размывают только предыдущее содержимое", async () => {
  const variants: Modes[] = []
  for (const forcedPortable of [false, true]) {
    const modes = await capture(forcedPortable)
    variants.push(modes)
    for (const probe of Object.values(modes)) {
      expect(probe.forcedPortable).toBe(forcedPortable)
      expect(probe.deviceFeatures.includes("dual-source-blending")).toBe(!forcedPortable && probe.adapterSupportsDualSource)
    }
    for (const [mode, result] of Object.entries(modes)) {
      const {frames} = result
      const zero = frames.zero!, blurred = frames.blurred!
      expect(zero.insideWhite![0], mode).toBeGreaterThan(230)
      expect(zero.insideBlack![0], mode).toBeLessThan(25)
      expect(blurred.insideWhite![0], mode).toBeLessThan(zero.insideWhite![0]! - 20)
      expect(blurred.insideBlack![0], mode).toBeGreaterThan(zero.insideBlack![0]! + 20)
      expect(blurred.insideWhite![0], mode).toBeGreaterThan(blurred.insideBlack![0]!)
      for (const key of ["insideWhite", "insideBlack"] as const) {
        for (let channel = 0; channel < 4; channel++) {
          const expected = (zero[key]![channel]! + blurred[key]![channel]!) / 2
          expect(Math.abs(frames.halfOpacity![key]![channel]! - expected), `${mode}/${key}: opacity .5 смешивает исходный фон и blur`).toBeLessThanOrEqual(3)
        }
      }
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
      expect(frames.roiLeft!.roiLeft![0], mode).toBeGreaterThan(20)
      expect(frames.roiLeft!.roiRight![0], mode).toBeLessThan(5)
      expect(frames.roiRight!.roiRight![0], mode).toBeGreaterThan(20)
      expect(frames.roiRight!.roiLeft![0], mode).toBeLessThan(5)
      expect(frames.roiLeftAgain, `${mode}: возврат в отдельный ROI не оставляет старые пиксели`).toEqual(frames.roiLeft)
      expect(frames.clipped!.insideBlack![0], mode).toBeGreaterThan(20)
      expect(frames.clipped!.clipOutside, `${mode}: blur не выходит за overflow clip`).toEqual(zero.clipOutside)
      if (mode === "hud") {
        const alpha = frames.alphaBlur!.insideBlack!
        expect(alpha[3]).toBeGreaterThan(10)
        expect(alpha[3]).toBeLessThan(180)
        for (let channel = 0; channel < 3; channel++) {
          expect(Math.abs(alpha[channel]! - alpha[3]!), "premultiplied white keeps RGB equal to alpha").toBeLessThanOrEqual(3)
        }
        for (let channel = 0; channel < 4; channel++) {
          const expected = (frames.alphaNone!.insideBlack![channel]! + alpha[channel]!) / 2
          expect(Math.abs(frames.alphaHalf!.insideBlack![channel]! - expected), "opacity .5 сохраняет premultiplied RGBA").toBeLessThanOrEqual(3)
        }
      }
      expect(result.rasterCandidateCreated, mode).toBe(true)
      expect(result.noneCleared, mode).toBe(true)
      expect(result.moveReused, mode).toBe(true)
      expect(result.disposeCleared, mode).toBe(true)
      expect(result.released, mode).toEqual([0, 0, 0, 255])
    }
  }
  const [automatic, portable] = variants as [Modes, Modes]
  for (const mode of Object.keys(automatic) as (keyof Modes)[]) {
    for (const [frame, samples] of Object.entries(automatic[mode].frames)) {
      for (const [probe, channels] of Object.entries(samples)) {
        channels.forEach((value, index) => {
          expect(Math.abs(value - portable[mode].frames[frame]![probe]![index]!), `${mode}/${frame}/${probe}: portable blend matches optional dual-source`).toBeLessThanOrEqual(3)
        })
      }
      automatic[mode].cornerProfiles[frame]?.forEach((value, index) => {
        expect(Math.abs(value - portable[mode].cornerProfiles[frame]![index]!), `${mode}/${frame}: rounded AA parity`).toBeLessThanOrEqual(3)
      })
    }
  }
}, 90000)
