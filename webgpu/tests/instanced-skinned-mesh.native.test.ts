import {expect, test} from "bun:test"

test("one native instanced draw has independent live poses, retained replay and resource cleanup", async () => {
  const worker = Bun.spawn([process.execPath, "--conditions=source", `${import.meta.dir}/../../headless/fixtures/instanced-skinned-mesh.ts`], {
    cwd: `${import.meta.dir}/../..`, stdout: "pipe", stderr: "pipe", timeout: 30000,
  })
  const [exit, stdout, stderr] = await Promise.all([worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text()])
  expect(exit, stderr).toBe(0)
  const result = JSON.parse(stdout) as {
    frames: {name: string, hash: string, passes: number, changedLeft: number, changedRight: number}[]
    draws: number[][]
    firstDraws: number[][]
    palettes: number[]
    created: number
    destroyed: number
  }
  const frames = new Map(result.frames.map(frame => [frame.name, frame]))
  expect(result.firstDraws).toEqual([[3, 2]])
  expect(result.palettes[14]).toBe(-150)
  expect(result.palettes[30]).toBe(150)
  expect(frames.get("repeat")!.passes).toBe(0)
  expect(frames.get("pose-repeat")!.passes).toBe(0)
  expect(frames.get("second-pose")!.changedLeft).toBe(0)
  expect(frames.get("second-pose")!.changedRight).toBeGreaterThan(20)
  expect(frames.get("two")!.hash).toBe(frames.get("second-pose")!.hash)
  expect(frames.get("reallocated")!.hash).toBe(frames.get("two")!.hash)
  expect(frames.get("empty")!.hash).not.toBe(frames.get("two")!.hash)
  expect(result.created).toBe(result.destroyed)
}, 35000)
