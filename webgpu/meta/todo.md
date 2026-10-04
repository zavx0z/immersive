# Задачи по ресурсам WebGPU

## Текст без промежуточной раскладки

* [ ] В `WebGpuBackend.#createText` передавать окончательные параметры
  создаваемому CachedText после реализации контракта Engine.

[Backend](../src/webgpu-backend.ts) создаёт Text,
затем меняет интервалы и вызывает `updateGeometry()` повторно.
[Доказательства и критерии у Engine](../../engine/meta/todo.md).
Сохранить разделяемую геометрию и согласовать освобождение CPU/GPU при вытеснении.

## Матрицы скелетов только для потребителей

* [ ] Разделить ёмкость обычных объектов и хранилище матриц скелетов.
* [ ] Определить освобождение избыточной ёмкости после уменьшения сцены.

В [Renderer](../src/renderer/index.ts)
`createPerObjectResources` выделяет CPU и GPU по 8192 байта костей на каждый слот,
`ensurePerObjectCapacity` растёт степенями двойки без уменьшения.
Размер задан в [per-object-upload](../src/renderer/per-object-upload.ts):
128 матриц по 16 float32. На сцене 780 объектов, 0 со скелетами, ёмкость 2048:
16 MiB CPU + 16 MiB GPU под кости. Это отдельные ресурсы, не одно измерение RSS.
Доказательство: [renderer-memory-scene.json](research/2026-10-04/renderer-memory-scene.json).

Готовность: сцена без скелетов не резервирует большой массив костей;
появление/удаление и анимация скелетов работают, корректны dynamic offsets,
bind groups и границы буферов. После краткого увеличения сцены память освобождается
по явной политике без перераспределения на каждом кадре. Не убирать поддержку анимации.

## Полноэкранные текстуры и освобождение Renderer

* [ ] Проверить политику жизни depth/MSAA/presented-frame и окончательный dispose.

В активном Renderer подтверждены три текстуры 3840×2176: depth24plus-stencil8
с 4 samples, bgra8unorm с 4 samples и копия presented frame с 1 sample.
Номинально при 4 байтах на sample это 286,875 MiB. Физическое размещение depth,
драйверные расходы и residency не измерены. `displayRasterTargets` был пуст.
`updateTextures` освобождает старые текстуры при замене, но общего `dispose`
Renderer при исследовании не найдено. Копия presented frame поддерживает capture.
Не снижать DPR/MSAA и не удалять capture без сохранения их контрактов.

Готовность: resize и полное завершение Experience освобождают ресурсы;
HMR с сохранением Experience не уничтожает используемый Renderer.
[Граница lifecycle с Browser](../../browser/meta/todo.md).

## Материалы и ограничения измерения

* [renderer-memory-scene.json](research/2026-10-04/renderer-memory-scene.json) — прямое чтение активного Renderer.
* [renderer-memory.json](research/2026-10-04/renderer-memory.json) — последний замер после переключений журнала.
* [after-toggle.json](research/2026-10-04/after-toggle.json) и [after-toggle-4.json](research/2026-10-04/after-toggle-4.json) — 2 и 4 цикла
  закрытия/открытия. GPU geometry: 14 410 428 → 14 646 176 → 14 764 832 байта;
  новые подписи и время команд попадают в кэш, это не доказательство утечки.
* [gpu-memory.json](research/2026-10-04/gpu-memory.json) и [buffers.json](research/2026-10-04/buffers.json) — ранняя перепись
  JS-обёрток. Она может включать уничтоженные ресурсы; не считать все обёртки
  одновременно активной GPU-памятью. Прямая проверка владельца достовернее.

Скрипты сохранены рядом как `.ts.txt`; исходное место запуска —
`storybook/tmp/performance`, разрешение на CDP было дано для исследования.
