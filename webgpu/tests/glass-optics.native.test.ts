import {expect, test} from "bun:test"
import {compositeGlass, glassShell} from "../src/renderer/glass-optics"

test("настоящий GPU: поглощение, перестановка стекла, opaque depth и HUD", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/glass-optics.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 30000,
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text()])
    expect(exit, stderr).toBe(0)
    const frames = JSON.parse(stdout) as Record<string, {center: number[], hud: number[]}>
    expect(frames.white!.center).toEqual([255, 255, 255, 255])
    const expected = compositeGlass([1, 1, 1, 1], [glassShell([.8, .5, .25], .4, 1, 1, 1)])
    expected.forEach((value, channel) => expect(Math.abs(frames.one!.center[channel]! - Math.round(value * 255))).toBeLessThanOrEqual(2))
    expect(frames.two!.center.slice(0, 3).every((value, channel) => value < frames.one!.center[channel]!)).toBeTrue()
    expect(frames.reordered!.center).toEqual(frames.two!.center)
    expect(frames.unlitBlack!.center).toEqual([0, 0, 0, 255])
    expect(frames.opaqueAndHud!.center).toEqual([255, 0, 0, 255])
    expect(frames.opaqueAndHud!.hud).toEqual([0, 255, 0, 255])
    expect(frames.matchedIor!.center).toEqual([255, 255, 255, 255])
    expect(frames.litBlack!.center.slice(0, 3).some(value => value > 0)).toBeTrue()
    expect(frames.disabled!.center).toEqual([255, 255, 255, 255])
    expect(frames.repeated!.center).toEqual(frames.reenabled!.center)
    expect(frames.rasterWhite!.center).toEqual([255, 255, 255, 255])
    expected.forEach((value, channel) => expect(Math.abs(frames.rasterGlass!.center[channel]! - Math.round(value * 255))).toBeLessThanOrEqual(2))
    expect(frames.rasterGlass!.hud).toEqual([0, 255, 0, 255])
    expect(frames.rasterRepeated).toEqual(frames.rasterGlass)
    expect(frames.rasterResized).toEqual(frames.rasterGlass)
    expected.forEach((value, channel) => expect(Math.abs(frames.directGlass!.center[channel]! - Math.round(value * 255))).toBeLessThanOrEqual(2))
    expect(frames.directGlass!.hud).toEqual([0, 255, 0, 255])
    expect(frames.directRepeated).toEqual(frames.directGlass)
    expect(frames.releasedDisplay!.center).toEqual([0, 0, 0, 255])
  } finally {
    if (worker.exitCode === null) worker.kill()
    await worker.exited
  }
}, 35000)
