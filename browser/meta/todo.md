# Задачи по освобождению Experience

* [ ] Проверить полное завершение Root и смену platform epoch при HMR:
  освобождение scene, listeners, frames и ресурсов Renderer.

Это гипотеза для проверки, а не установленная утечка HMR.
В последнем контексте найден ровно один Renderer:
[renderer-instances.json](research/2026-10-04/renderer-instances.json). В `space-runtime.ts` dispose снимает
обработчики, кадры и display resources; контракт полного освобождения Renderer
нужно сверить с [WebGPU](../../webgpu/meta/todo.md).
[Текущий lifecycle](../src/space-runtime.ts).
App владеет старыми контроллерами страницы, Browser — общим Experience.

Готовность: отдельные серии HMR с прежним и новым platform epoch, полное
закрытие Root; после сборки мусора не остаётся старых Renderer/контроллеров.
При сохранении Root остаются тот же Document, Canvas, фокус и состояние.
Не создавать отдельный Canvas/Renderer для окон или журналов.

## Контекст измерений

[memory-context.json](research/2026-10-04/memory-context.json) фиксирует timeOrigin 1791145356214.8,
DPR 2, viewport 1920×1088, Canvas 3840×2176, heap около 51 МБ,
backing storage около 64,5 МБ. [investigation-start.json](research/2026-10-04/investigation-start.json) — состояние
начала повторного исследования. Это другой realm, чем раннее зависание;
сравнение с прежними 849 МБ не является чистым before/after.

[heap-after.json](research/2026-10-04/heap-after.json) — прежний контекст после HMR: принудительный GC
снизил used heap примерно с 650 до 159 МБ при backing storage около 507 МБ.
Нельзя приписывать весь спад исправлению UI или складывать heap, backing storage,
GPU allocations и process RSS как независимые величины. `Runtime.queryObjects`
также может инициировать GC. Перепись через ArrayBuffer.prototype дала неполный
результат; для выводов использованы поля активного владельца.

Скрипты рядом сохранены как `.ts.txt`, не запускаются автоматически.

## Реализованный final lifecycle

Canvas и Space runtime вызывают `engineRenderer.dispose()` только при своём
окончательном dispose; same-Experience render сохраняет существующий runtime.
Освобождение Renderer и presentation host claim защищено `finally`, включая
ошибку последнего consumer cleanup. Plane/overlay не уничтожают общий Renderer.
Внешняя startup boundary удерживает Renderer с момента создания и завершает его
при любом неуспешном constructor/init path. Общий guarded release исключает
двойное освобождение при вложенных startup/final cleanup.
[Startup regressions](../tests/startup-resources.test.ts) воспроизводят отказ
NativeInputHost и backend без textMeasurer после успешной GPU инициализации
и повторный startup того же Canvas после освобождения claim.
[Space lifecycle test](../tests/render-fault-latch.test.ts) и
[Canvas test](../tests/canvas-matrix.test.ts) проверяют ровно одно final освобождение.
[Root test](../tests/experience.test.ts) подтверждает один runtime, прежний
Document/Element и component state при render обновлениях. Это seams evidence;
живая серия same/new epoch HMR и GC ещё требуется по критерию выше.
