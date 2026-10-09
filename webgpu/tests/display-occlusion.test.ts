import {expect, test} from "bun:test"
import {resolve} from "node:path"

type Result = {
  mode: "direct" | "raster" | "mixed" | "mixed-front"
  frames: Record<string, {center: number[], body: number[], foreground: number[], hud: number[]}>
  rasterized: Record<string, boolean[]>
}

test("[DISPLAY-OCCLUSION] настоящие пиксели сохраняют глубину Display, paint order окон и HUD в прямом и растровом режимах", async () => {
  const worker = Bun.spawn([process.execPath, resolve(import.meta.dir, "../../headless/fixtures/display-occlusion.ts")], {
    cwd: resolve(import.meta.dir, "../.."),
    stdout: "pipe",
    stderr: "pipe",
    timeout: 60000,
  })
  try {
    const [exitCode, stdout, stderr] = await Promise.all([
      worker.exited,
      new Response(worker.stdout).text(),
      new Response(worker.stderr).text(),
    ])
    expect(exitCode, `Нативная проверка Display должна завершиться без GPU ошибок: ${stderr}`).toBe(0)
    const {results} = JSON.parse(stdout) as {results: Result[]}
    expect(results.map(result => result.mode), "Проверяются прямой, растровый и оба смешанных пути").toEqual(["direct", "raster", "mixed", "mixed-front"])
    for (const {mode, frames, rasterized} of results) {
      for (const name of ["near-first", "unchanged", "far-first"]) {
        expect(frames[name]!.center, `${mode}/${name}: верхнее окно ближнего Display закрывает дальний`).toEqual([255, 0, 255, 255])
        expect(frames[name]!.body, `${mode}/${name}: непрозрачный фон ближнего Display закрывает дальний`).toEqual([0, 255, 0, 255])
      }
      expect(rasterized["near-first"], `${mode}: должны реально выполняться нужные GPU пути`).toEqual(
        mode === "direct" ? [false, false] : mode === "raster" ? [true, true] : mode === "mixed" ? [false, true] : [true, false],
      )
      const blended = frames["translucent"]!.body
      for (const channel of [blended[0]!, blended[1]!]) {
        expect(channel, `${mode}: полупрозрачный Display смешивается с дальним`).toBeGreaterThanOrEqual(126)
        expect(channel, `${mode}: полупрозрачный Display смешивается с дальним`).toBeLessThanOrEqual(129)
      }
      expect(blended.slice(2), `${mode}: смешивание не добавляет синий и сохраняет alpha`).toEqual([0, 255])
      for (const name of ["window-raised", "world-foreground", "backdrop", "camera-return"]) {
        expect(frames[name]!.center, `${mode}/${name}: поднятое окно сохраняет paint order внутри Display`).toEqual([255, 255, 0, 255])
      }
      for (const name of ["world-foreground", "backdrop"]) {
        expect(frames[name]!.foreground, `${mode}/${name}: передний World Mesh перекрывает Display`).toEqual([0, 0, 255, 255])
      }
      expect(frames["camera-behind"]!.center, `${mode}: при перемещении камеры противоположный Display становится ближним`).toEqual([255, 0, 0, 255])
      for (const [name, frame] of Object.entries(frames)) {
        expect(frame.hud, `${mode}/${name}: HUD остаётся поверх пространственных Display`).toEqual([0, 255, 255, 255])
      }
    }
  } finally {
    if (worker.exitCode === null) worker.kill()
    await worker.exited
  }
}, 65000)
