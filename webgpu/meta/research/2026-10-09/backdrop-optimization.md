# Эффективность UI backdrop: измерения коммита

В этом изменении удалены полноразмерные snapshots перед каждой панелью,
сокращён вертикальный Gaussian kernel без изменения дискретных весов,
введены ограниченный cache результатов фильтра и точное повторение готового кадра.
Готовые операции смешиваются в одном UI pass. Геометрия окон, sigma и разрешение
содержимого не уменьшались ради результата.

База: `ac56cd5798bfbdecfd74d21501b60d66e2bc4902`.
Оптимизированная версия — исходники коммита, содержащего этот отчёт.
Отдельный worktree `immersive-window-layers`, ветка `codex/window-layers`.
Интеграция в основной checkout и визуальная приёмка в живом приложении не выполнены.

## Метод

Intel HD Graphics 630, Metal, macOS 13.7.8, Intel x64, Bun 1.4.2 / bun-webgpu.
Одинаковый harness собирается с историческими WebGPU-исходниками и с текущими.
Базовая сборка читает `git show <revision>:webgpu/src/...`, не переключая checkout.
SHA-256 harness/config у двух основных результатов совпадают. JSON хранит
hash исполняемого bundle, версии исторических файлов, diff hash и hashes новых
файлов рабочего дерева. Самоидентификация будущим hash коммита не подставляется.

На Canvas видны три панели по 50% ширины и высоты, 20 полос внешней сцены,
один ближний синий объект и по одному цветному DOM child в каждой панели.
Sigma — 8 CSS px, CSS px равен backing pixel. В основной серии используется
матрица Display высокой плотности. Во всех фазах видны те же панели и children;
`none`, `one`, `three` меняют только число включённых blur.

- `moving`: двигается ближний World; Gaussian пересчитывается.
- `static`: после первого кадра всё неизменно.
- `foreground`: двигается только child последней панели через DOM/layout/backend,
  после всех включённых фильтров. Текст отдельно проверяется native regression.

Два блока с обратным порядком фаз, по 6 кадров прогрева и 20 измеряемых кадров
на фазу в каждом блоке: 40 samples на ячейку. Primary metric — wall time
`renderComposition` вместе с 1px copy/map, ожидающим завершения очереди GPU.
Подготовка DOM/layout/backend измеряется отдельно в `prepareCpuMs`; в primary
не входит. Это **не чистое GPU-время и не FPS браузера/приложения**.
Компиляция при включении эффекта исключена прогревом; её allocations видны в JSON.
Изоляции от чужих задач, thermal/frequency drift и OS scheduling нет.

## Основная серия: медиана и p95 в миллисекундах

[База](backdrop-optimization-baseline.json),
[результат](backdrop-optimization-result.json).
Положительное изменение означает уменьшение wall time.

| Canvas | Изменение | Blur | До, median | После, median | После, p95 | Сокращение |
|---|---|---|---:|---:|---:|---:|
| 1280×720 | moving | none | 9.29 | 7.75 | 9.77 | 16.6% |
| 1280×720 | moving | one | 11.33 | 10.22 | 13.00 | 9.8% |
| 1280×720 | moving | three | 18.29 | 15.77 | 22.34 | 13.8% |
| 1280×720 | static | none | 8.32 | 1.29 | 1.76 | 84.5% |
| 1280×720 | static | one | 10.56 | 1.26 | 1.58 | 88.1% |
| 1280×720 | static | three | 16.88 | 1.36 | 1.94 | 91.9% |
| 1280×720 | foreground | none | 7.69 | 7.66 | 9.30 | 0.4% |
| 1280×720 | foreground | one | 10.34 | 7.88 | 11.78 | 23.8% |
| 1280×720 | foreground | three | 15.87 | 10.18 | 15.24 | 35.8% |
| 2730×2176 | moving | none | 41.99 | 42.11 | 47.80 | -0.3% |
| 2730×2176 | moving | one | 59.61 | 50.77 | 55.28 | 14.8% |
| 2730×2176 | moving | three | 84.23 | 74.16 | 83.27 | 11.9% |
| 2730×2176 | static | none | 41.86 | 3.39 | 6.29 | 91.9% |
| 2730×2176 | static | one | 57.51 | 3.66 | 6.05 | 93.6% |
| 2730×2176 | static | three | 85.20 | 3.41 | 5.42 | 96.0% |
| 2730×2176 | foreground | none | 41.68 | 42.72 | 46.97 | -2.5% |
| 2730×2176 | foreground | one | 56.51 | 46.55 | 56.55 | 17.6% |
| 2730×2176 | foreground | three | 81.66 | 59.60 | 65.30 | 27.0% |

Для трёх панелей на 2730×2176: примерно 12% при движении сцены, 27% при изменении
верхнего UI и 96% при неподвижном кадре. Это разные механизмы: быстрый shader,
reuse готовых фильтров и копирование полного готового кадра соответственно.
Подвижная сцена этого размера всё ещё дорога: примерно 74 ms. Результат не
означает достижение 60 FPS на этом адаптере.

Количество GPU render passes после прогрева:

| Сценарий | none | one | three | Gaussian для three |
|---|---:|---:|---:|---:|
| moving | 1 | 4 | 10 | 6 |
| static | 0 | 0 | 0 | 0 |
| foreground | 1 | 2 | 3 | 0 |

В foreground/three три прохода — сцена, объединённый UI и финальный resolve.
Во всех измеряемых samples основной серии GPU textures/buffers не создавались
и не уничтожались. Счётчики после dispose сбалансированы во всех шести случаях.
Они не измеряют скрытые driver allocations или residency. Cache V outputs
ограничен 32 MiB; при нехватке памяти используется scratch без ухудшения качества.
Одна общая fallback V texture пока сохраняется вместе с H даже при cache hits.

## Разброс и ограничения

Сохраняются и предыдущие результаты, включая неудобные для сравнения:

- [Ранняя база](backdrop-optimization-earlier-baseline.json).
- [До объединения UI-проходов](backdrop-optimization-before-grouping.json).
- [Повтор малой базы](backdrop-optimization-repeat-baseline.json).
- [Повтор малой версии до объединения](backdrop-optimization-repeat-before-grouping.json).

В повторе 1280×720/foreground/none было 7.66 ms у базы и 15.22 ms у предыдущей
версии; в финальной основной серии 7.69 и 7.66 ms. Не удаляем выброс и не
приписываем весь wall-time выигрыш коду. Неизменный pass count и нулевые allocations
сами по себе не доказывают отсутствие регрессии. Сравнение входов кадра добавляет
CPU-работу, и отсутствие overhead для каждого изменяющегося кадра не заявляется.
На большом Canvas/none финальная медиана выше базы на 0.3–2.5% в двух подвижных
сценариях. Нужен браузерный профиль на целевом устройстве перед общей приёмкой.

Один финальный запуск завершился до samples ошибкой native binding при создании
pipeline: [`nextInChain must be nullptr`](backdrop-native-binding-failure.txt).
Повтор того же bundle без изменения кода завершился успешно. Во время проверок
также наблюдалась непостоянная ошибка `SurfaceSourceMetalLayer` в ColorTargetState;
и одна ошибка некорректного `WGPUVertexStepMode`; изолированные повторы и полный suite прошли. Ошибки не перехватываются тестами
и не превращаются в пропущенные проверки.

Пробовался дополнительный ручной ROI resolve перед H: он не дал устойчивого
выигрыша и в итог не включён. Разреженный Gaussian с меньшим числом исходных taps
не принят из-за видимых полос; сокращается только эквивалентный V kernel.
Общий кэш параметров всех слоёв остаётся консервативным: часть изменений может
пересчитать больше фильтров, чем теоретически необходимо. Это не оптимальный
системный compositor уровня ОС и не доказательство глобального максимума.

## Проверка корректности

- Native HUD/Display проверяют прозрачный alpha, rounded AA, clipping,
  high/low-DPI, внешний World и отсутствие halo у ближних непрозрачных объектов.
  Выполняются dual-source и принудительная portable ветви.
- Prefix test с реальным Inter сравнивает каждое состояние с новым Renderer и
  пустым cache: максимум 2 единицы RGBA из 255. Изменения последнего, среднего
  и первого текста дают соответственно 0, 2 и 4 Gaussian passes; world/camera/resize
  возвращают все 6. Проверяется порядок text stencil/cover в объединённом проходе.
- Frame replay проверяет свет, камеру, геометрию, текст, clipping, visibility,
  sigma и замену bitmap при сохранении GPU texture identity.
- CPU tests проверяют эквивалентность kernel, budget fallback, abort/submit,
  resize/pruning, частичные allocation failures и владение borrowed ресурсами.

Итоговая проверка этого изменения:

- `bun test webgpu/tests`: 250 pass, 0 fail, 243098 assertions.
- `bun test --preload ./headless/preload.ts headless/tests`: 46 pass, 0 fail.
- Window `spec` + `test` с headless preload: 38 pass, 13 skip, 0 fail.
  Пропуски не считаются визуальной приёмкой окон.
- Typecheck: WebGPU, Headless, Window, Renderer HTML — pass.
- `git diff --check` — pass; hashes production-файлов совпадают с измеренным bundle manifest.

## Повторение

Из корня worktree, с установленными workspace dependencies:

```sh
mkdir -p tmp/backdrop-opt
ln -s ../../headless/node_modules tmp/backdrop-opt/node_modules
bun headless/fixtures/backdrop-performance-build.ts ac56cd57 tmp/backdrop-opt/baseline.ts
bun headless/fixtures/backdrop-performance-build.ts working tmp/backdrop-opt/result.ts
bun tmp/backdrop-opt/baseline.ts --label baseline --base ac56cd57 --motion all --densities high --warmup 6 --samples 20 --first reverse --output tmp/baseline.json
bun tmp/backdrop-opt/result.ts --label optimized --base ac56cd57 --motion all --densities high --warmup 6 --samples 20 --first reverse --output tmp/result.json
```

Существующий symlink повторно создавать не требуется. Native GPU задания
запускать последовательно. Low-DPI доступен через `--densities high,low`;
он проверен пиксельными тестами, но не входит в основную числовую таблицу.
Изменение реализации в следующем коммите требует нового измерения и сохранения
его raw results рядом с изменением, а не переноса этих чисел как новых.
