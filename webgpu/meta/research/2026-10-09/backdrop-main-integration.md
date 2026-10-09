# Слияние Window и backdrop в main

Слияние `codex/window-layers` (`37fb8e5d`) в существующий `main` (`1c84d6de`)
выполнено без конфликтов. Сохранены настройки/виджеты из main и незакоммиченные
правки редактора и layout других задач. Общий механизм по-прежнему даёт отдельное
активное окно на HUD и каждый Display одного Document.

[Новый raw замер после слияния](backdrop-main-integration-performance.json)
включён в этот merge-коммит. Это тот же native workload, 3 видимые панели,
sigma8, Intel HD630, 6 warmup + 20 samples в каждом из 2 обратных блоков.
Wall time включает renderComposition + 1px copy/map GPU fence, но не подготовку
DOM/layout. Это не замер FPS Storybook. Условия и ограничения предыдущего
[сравнения до/после](backdrop-optimization.md) сохраняются.

| Canvas | Изменение | Median, ms | p95, ms | Render passes |
|---|---|---:|---:|---:|
| 1280×720 | moving | 16.60 | 21.43 | 10–10 |
| 1280×720 | static | 1.46 | 3.42 | 0–0 |
| 1280×720 | foreground | 12.64 | 14.66 | 3–3 |
| 2730×2176 | moving | 77.21 | 94.04 | 10–10 |
| 2730×2176 | static | 3.27 | 3.95 | 0–0 |
| 2730×2176 | foreground | 55.16 | 61.10 | 3–3 |

После прогрева измеренные GPU allocations нулевые; после dispose счётчики
ресурсов сбалансированы. Подтверждение Window на объединённом main:
80 pass, 13 skip, 0 fail, 282 assertions в сценариях Window, WindowControl,
activity и общем window.test. Ранее ветка прошла 250 WebGPU tests.

Подключение общего родителя окон и оформления в приложении принадлежит
Storybook и выполняется отдельным consumer-коммитом с проверкой живой среды.
Само слияние платформы не является визуальной приёмкой приложения.
