import type {ImmersiveNodesLayoutPrismTree} from "@zavx0z/immersive-nodes-layout-prism-tree"
import type {ComposeSlotInput} from "@zavx0z/immersive-component/slot"
import type {DisplayElement} from "@zavx0z/immersive-dom/display"
import type {Presentation} from "@zavx0z/immersive-browser/integration"
import type {SpatialTreeDisplay, SpatialTreeScene} from "../src/scene.ts"
import type {SpatialTreeNode} from "./node.ts"

/** Один store подготавливается до mount того же Browser Root. */
export interface SpatialTreeState {
  readonly id: string
  getSnapshot(): SpatialTreeSnapshot | null
  subscribe(listener: () => void): () => void
  publish(snapshot: SpatialTreeSnapshot | null): void
}

/** Видимая часть сцены; полная числовая геометрия остаётся в общем cache. */
export interface SpatialTreeSnapshot {
  readonly nodes: readonly SpatialTreeDisplay[]
  readonly volumes: SpatialTreeScene["volumes"]
  /** Неизменные role streams; старые авторские снимки могут использовать общий volumes. */
  readonly bodyVolumes?: SpatialTreeScene["bodyVolumes"]
  readonly branchVolumes?: SpatialTreeScene["branchVolumes"]
  readonly visibleVolumeIds: ReadonlySet<string>
  readonly disabledHitIds: ReadonlySet<string>
  readonly geometryRevision: number
  readonly selectedId: string | null
  readonly selectedVolumeId: string | null
  readonly contentById: ReadonlyMap<string, ComposeSlotInput["content"]>
  readonly floor: SpatialTreeScene["floor"]
  readonly showGrid?: boolean
  readonly onHost: (id: string, display: DisplayElement | null) => void
  /** Запрос выбора; вызывающий владелец подтверждает его через controller.select. */
  readonly onActivate: (id: string, focus?: boolean) => void
  readonly onVolumeActivate: (volumeId: string, event: MouseEvent) => void
}

export interface SpatialTreeControllerOptions {
  readonly root: Presentation
  readonly state?: SpatialTreeState
  readonly getViewport: () => Readonly<{width: number; height: number}> | null
  readonly preserveViewPoint?: boolean
  /** Показывать опорную сетку Z=0; по умолчанию геометрический пол не рисуется. */
  readonly showGrid?: boolean
  /** Числовые размеры промежутков в мм; без значений выбираются по размеру Display. */
  readonly layout?: ImmersiveNodesLayoutPrismTree.Input["options"]
  /** Продолжительность явного focus в том же presented lifecycle; 0 выбирает мгновенный переход. */
  readonly motionDurationMs?: number
}

export interface SpatialTreeController {
  readonly configured: boolean
  readonly state: SpatialTreeState
  /** После idle onDemand запрашивает ближайший meaningful Display, если он холодный; загруженный ближайший не запускает подгрузку соседей. */
  configure(nodes: readonly SpatialTreeNode[], onSelect: (id: string, focus?: boolean) => void, onDemand?: (id: string) => void): void
  ensureDisplay(id: string): DisplayElement
  setContent(id: string, content: ComposeSlotInput["content"]): void
  release(id: string): void
  select(id: string, focus?: boolean): void
  /** Factor < 1 приближает: fly перемещает eye+target, orbit меняет radius. */
  zoom(factor: number): void
  fit(): void
  updateViewport(size: Readonly<{width: number; height: number}>): void
  dispose(): void
}
