# Задачи по ресурсам WebGPU

## Текст без промежуточной раскладки

* [x] В `WebGpuBackend.#createText` передавать окончательные параметры
  создаваемому CachedText после реализации контракта Engine.

[Backend](../src/webgpu-backend.ts) создаёт Text,
затем меняет интервалы и вызывает `updateGeometry()` повторно.
[Доказательства и критерии у Engine](../../engine/meta/todo.md).
Сохранить разделяемую геометрию и согласовать освобождение CPU/GPU при вытеснении.

При удалении retained text backend освобождает его Engine lease; GPU cache
получает окончательные eviction notifications непосредственно у Renderer.
Backend не подписывается повторно и не забирает глобальную очередь.
[Focused test](../tests/text-cache-lifecycle.test.ts) проверяет единственное первое
построение, изменения интервалов и сохранение общей геометрии соседнего backend.
Живая проверка GPU и полный lifecycle выполняются после общей интеграции.

## Матрицы скелетов только для потребителей

* [x] Разделить ёмкость обычных объектов и хранилище матриц скелетов.
* [x] Определить освобождение избыточной ёмкости после уменьшения сцены.

При исходном исследовании [Renderer](../src/renderer/index.ts) выделял CPU и GPU
по 8192 байта костей на каждый render slot и увеличивал ёмкость без уменьшения.
Размер задан в [per-object-upload](../src/renderer/per-object-upload.ts):
128 матриц по 16 float32. На сцене 780 объектов, 0 со скелетами, ёмкость 2048:
16 MiB CPU + 16 MiB GPU под кости. Это отдельные ресурсы, не одно измерение RSS.
Доказательство: [renderer-memory-scene.json](research/2026-10-04/renderer-memory-scene.json).

Готовность: сцена без скелетов не резервирует большой массив костей;
появление/удаление и анимация скелетов работают, корректны dynamic offsets,
bind groups и границы буферов. После краткого увеличения сцены память освобождается
по явной политике без перераспределения на каждом кадре. Не убирать поддержку анимации.

Теперь canonical offsets костей относятся только к skinned slots; остальные draws
разделяют валидный offset 0. Без skeleton CPU bones пуст, GPU оставляет ровно один
8192-byte binding. Обычный uniform buffer остаётся отдельным. Ёмкости растут
степенями двойки; при использовании не более четверти резерва таймер через 1s
пересчитывает актуальную потребность и освобождает резерв даже без следующего
demand frame (минимум ordinary 512 slots, skeleton 1). При 0 skeleton
их память освобождается сразу до единственного GPU binding. Замена любого
per-object binding очищает все render bundles; изменение offsets внутри прежней
ёмкости сравнивается полным command tape.
[CPU/fake-GPU regressions](../tests/renderer-resources.test.ts) проверяют static+skin,
анимацию, границы и draw после idle trim.
[Bundle regression](../tests/render-bundle-cache.test.ts) сохраняет строгую проверку
изменения skin offset при прежнем bind group. Это доказательства descriptors
и lifecycle, не измерение native GPU residency/RSS.

## Полноэкранные текстуры и освобождение Renderer

* [ ] Проверить политику жизни depth/MSAA/presented-frame и окончательный dispose.

В активном Renderer подтверждены три текстуры 3840×2176: depth24plus-stencil8
с 4 samples, bgra8unorm с 4 samples и копия presented frame с 1 sample.
Номинально при 4 байтах на sample это 286,875 MiB. Физическое размещение depth,
драйверные расходы и residency не измерены. `displayRasterTargets` был пуст.
`updateTextures` освобождает старые текстуры при замене, но общего `dispose`
Renderer при исходном исследовании не найдено. Копия presented frame поддерживает capture.
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

Renderer теперь предоставляет идемпотентный final `dispose`: освобождает свои
buffers, attachments, views/caches, listeners и device, созданный через `init`.
Borrowed device не уничтожается; context unconfigure допускается лишь для
собственной актуальной configuration. Ошибка getContext/configure также
освобождает полученный owned device. Text eviction подписан один раз у Renderer
с weak ownership и явной отпиской при final dispose. Resize/capture/MSAA
сохраняют прежний контракт. Focused tests проверяют single destroy и сохранение
borrowed/reconfigured canvas. Native GPU и серия HMR/GC остаются live acceptance.

Отказ `requestDevice` по timeout не отменяет native allocation; Renderer также
уничтожает device, который разрешился после такого отказа. Deferred regression
проверяет позднее освобождение без публикации устройства. Fallback ownership
context регистрируется только после успешного configure, поэтому failed
configure не отзывает прежнюю чужую canvas configuration.
