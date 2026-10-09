import {expect, test} from "bun:test"

test("area prefilter removes high-frequency combs on both axes without alpha or foreground color leakage", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/backdrop-sampling.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 90000,
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text()])
    expect(exit, stderr).toBe(0)
    const result = JSON.parse(stdout) as {rotationDifference: number, roiDifference: number, frames: Record<string, {
      sigma: number, period: number, min: number, max: number, mean: number, colorLeak: number, premultipliedError: number, center: number[]
    }>}
    expect(result.roiDifference, "bounded prefilter includes every texel read by H/V").toBeLessThanOrEqual(1)
    expect(result.rotationDifference, "90-degree rotation preserves the blur").toBeLessThanOrEqual(2)
    for (const [name, frame] of Object.entries(result.frames)) {
      if (/^(vertical|horizontal|diagonal)-/.test(name) && frame.sigma >= 16) {
        expect(frame.max - frame.min, `${name}: high-frequency modulation`).toBeLessThanOrEqual(3)
        expect(Math.abs(frame.mean - 255 / frame.period), `${name}: conserved average`).toBeLessThanOrEqual(2)
      }
    }
    expect(result.frames.checker!.max - result.frames.checker!.min).toBeLessThanOrEqual(1)
    expect(result.frames.constant!.center).toEqual([20, 41, 61, 102])
    expect(result.frames.alpha!.premultipliedError).toBeLessThanOrEqual(1)
    expect(result.frames["all-foreground"]!.center).toEqual([0, 0, 0, 0])
    expect(result.frames.foreground!.colorLeak, "foreground red never enters the blur or its halo").toBeLessThanOrEqual(1)
    expect(result.frames.foreground!.center[3]).toBeGreaterThan(250)
    expect(result.frames["mixed-foreground"]!.colorLeak, "mixed MSAA samples are depth-tested before resolve").toBeLessThanOrEqual(1)
    expect(result.frames["mixed-foreground"]!.center[3]).toBeGreaterThan(250)
    expect(result.frames["single-sample"]!.max - result.frames["single-sample"]!.min).toBeLessThanOrEqual(3)
  } finally {
    if (worker.exitCode === null) worker.kill()
  }
}, 100000)
