import {expect, test} from "bun:test"

test("настоящий GPU: ближайшее ребро, порядок batches/сегментов, стекло и нулевая alpha", async () => {
  const worker = Bun.spawn([process.execPath, `${import.meta.dir}/../../headless/fixtures/line-depth.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 30000,
  })
  try {
    const [exit, stdout, stderr] = await Promise.all([worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text()])
    expect(exit, stderr).toBe(0)
    const {frames} = JSON.parse(stdout) as {frames: Record<string, number[]>}
    expect(frames.near).not.toEqual(frames.empty)
    expect(frames.defaultColorNear).toEqual(frames.near)
    expect(frames.defaultColorNearFar).toEqual(frames.near)
    expect(frames.defaultColorNearFarAgain).toEqual(frames.near)
    expect(frames.far).not.toEqual(frames.near)
    expect(frames.nearFar).toEqual(frames.near)
    expect(frames.farNear).toEqual(frames.near)
    expect(frames.crossNearFar).toEqual(frames.crossFarNear)
    expect(frames.batchNearFar).toEqual(frames.near)
    expect(frames.batchFarNear).toEqual(frames.near)
    expect(frames.glass).not.toEqual(frames.empty)
    expect(frames.glassNearFar).toEqual(frames.glassNear)
    expect(frames.frontGlassNear).not.toEqual(frames.near)
    expect(frames.frontGlassNear).not.toEqual(frames.frontGlass)
    expect(frames.frontGlassNearFar).toEqual(frames.frontGlassNear)
    expect(frames.zeroNearFar).toEqual(frames.far)
    expect(frames.farZeroNear).toEqual(frames.far)
    expect(frames.zeroNearGlass).toEqual(frames.glass)
    expect(frames.zeroColorNearFar).toEqual(frames.far)
    expect(frames.blockedLines).toEqual(frames.blocker)
  } finally {
    if (worker.exitCode === null) worker.kill()
    await worker.exited
  }
}, 35000)
