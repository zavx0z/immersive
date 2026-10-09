import { Matrix4, Ray, Vector3 } from "../math"

const LOOK_AT_EPSILON = 1e-6

/**
Параметры для создания точки обзора.
*/
export interface ViewPointParameters {
  /**
  Область Canvas в CSS px для aspect и zoom с неподвижной точкой под указателем.
  Browser обновляет эти данные при изменении размера; Engine не читает native DOM.
  */
  viewport?: ViewPointClientViewport

  /** Orbit приближает к target; fly проходит через уровни, перемещая eye и target вместе. */
  navigation?: ViewPointNavigation
  /** Скорость fly в мм на единицу zoom delta. @default 10 */
  flySpeed?: number

  /**
  Угол обзора (field of view) в радианах.
  @default 1 (≈57°)
  */
  fov?: number

  /**
  Ближняя плоскость отсечения. Объекты ближе этой distance не отображаются.
  Значение должно быть больше нуля.
  @default 0.1
  */
  near?: number

  /**
  Дальняя плоскость отсечения. Объекты дальше этой distance не отображаются.
  Значение должно быть больше `near`.
  @default 1000
  */
  far?: number

  /**
  Начальная позиция камеры в мм.
  @default { x: 10, y: -10, z: 10 }
  */
  position?: { x: number; y: number; z: number }

  /**
  Точка фокуса в мм.
  @default { x: 0, y: 0, z: 0 }
  */
  target?: { x: number; y: number; z: number }
}

export type ViewPointClientViewport = Readonly<{
  left: number
  top: number
  width: number
  height: number
}>

/** Мировые границы в мм; допускают плоскую область и совпадающие углы. */
export type ViewPointWorldBounds = Readonly<{
  min: Readonly<{x: number; y: number; z: number}>
  max: Readonly<{x: number; y: number; z: number}>
}>

/** Поза для численного расчёта без создания или изменения ViewPoint. */
export type ViewPointPose = Readonly<{
  position: Readonly<{x: number; y: number; z: number}>
  target: Readonly<{x: number; y: number; z: number}>
}>

export type ViewPointDepthRange = Readonly<{near: number; far: number}>

export type ViewPointNavigation = "orbit" | "fly"
export type ViewPointFrustumPlane = Readonly<{
  normal: Readonly<{x: number; y: number; z: number}>
  /** Внутренняя полуплоскость: normal·worldPoint + constant >= 0. */
  constant: number
}>
export type ViewPointFitOptions = Readonly<{fov: number; aspect: number; padding?: number}>


/**
Камера в правой системе Z-up с расстояниями в миллиметрах.

Orbit меняет азимут вокруг Z и наклон с ограничением у полюсов. Мировой up
не хранится как изменяемое состояние, горизонт не переворачивается.
Browser владеет событиями и передаёт сюда уже выбранные команды камеры.
Матрицы используют правую систему с глубиной clip space [0, 1].
*/
export class ViewPoint {
  public fov: number
  public aspect: number
  public near: number
  public far: number
  public navigation: ViewPointNavigation
  public flySpeed: number

  public position: Vector3
  public viewMatrix: Matrix4 = new Matrix4()
  public projectionMatrix: Matrix4 = new Matrix4()

  private viewport: ViewPointClientViewport | null
  private target: Vector3

  /**
  Возвращает clip range мировой AABB для явно заданной позы, не меняя ViewPoint.

  Глубина восьми углов вычисляется в double вдоль position → target. Полностью
  задняя область возвращает null. Передняя область получает near в половину
  ближайшей глубины и far с запасом 10%; это оставляет запас для следующих шагов
  жеста и сохраняет точность depth buffer. При пересечении плоскости камеры near
  равен 0.001 мм: геометрия ближе этого положительного порога может отсекаться.
  Не выбирает позу, FOV или момент применения; автор явно записывает near/far.

  @param bounds - Конечные мировые min/max в мм, min не превышает max по каждой оси.
  @param pose - Конечные position и target, которые не совпадают.
  @throws RangeError Если границы или поза не допускают конечный расчёт глубины.
  */
  public static depthRangeForBounds(bounds: ViewPointWorldBounds, pose: ViewPointPose): ViewPointDepthRange | null {
    for (let vectorIndex = 0; vectorIndex < 4; vectorIndex++) {
      const vector = vectorIndex === 0 ? bounds.min : vectorIndex === 1 ? bounds.max
        : vectorIndex === 2 ? pose.position : pose.target
      if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) {
        throw new RangeError("ViewPoint depth bounds and pose must be finite")
      }
    }
    if (bounds.min.x > bounds.max.x || bounds.min.y > bounds.max.y || bounds.min.z > bounds.max.z) {
      throw new RangeError("ViewPoint depth bounds must have ordered min/max")
    }
    const deltaX = pose.target.x - pose.position.x
    const deltaY = pose.target.y - pose.position.y
    const deltaZ = pose.target.z - pose.position.z
    const length = Math.hypot(deltaX, deltaY, deltaZ)
    if (!Number.isFinite(length) || length === 0) throw new RangeError("ViewPoint depth pose requires distinct finite position and target")
    const forwardX = deltaX / length
    const forwardY = deltaY / length
    const forwardZ = deltaZ / length
    let nearest = Infinity
    let farthest = -Infinity
    // Ровно восемь scalar dots: без Vector3, массивов углов и Float32 матриц.
    for (let corner = 0; corner < 8; corner++) {
      const x = (corner & 1) === 0 ? bounds.min.x : bounds.max.x
      const y = (corner & 2) === 0 ? bounds.min.y : bounds.max.y
      const z = (corner & 4) === 0 ? bounds.min.z : bounds.max.z
      const depth = (x - pose.position.x) * forwardX +
        (y - pose.position.y) * forwardY + (z - pose.position.z) * forwardZ
      if (!Number.isFinite(depth)) throw new RangeError("ViewPoint bounds depth must be finite")
      nearest = Math.min(nearest, depth)
      farthest = Math.max(farthest, depth)
    }
    if (farthest <= 0) return null
    const near = nearest > 0 ? Math.max(Number.MIN_VALUE, nearest * 0.5) : 0.001
    const far = Math.min(Number.MAX_VALUE, Math.max(farthest * 1.1, near * 2))
    return {near, far}
  }

  /**
  Вписывает реальные world points без пустых углов охватывающей AABB.

  Один проход по iterable балансирует четыре перспективные support planes
  выбранной Z-up базы. Первую точку использует как численный origin, сохраняя
  точность при больших мировых переносах. Точки не сохраняются и могут повторно
  использовать один изменяемый DTO между yield. Возвращает только pose.
  */
  public static fitPoseForPoints(points: Iterable<Readonly<{x: number; y: number; z: number}>>, backDirection: Readonly<{x: number; y: number; z: number}>, options: ViewPointFitOptions): ViewPointPose {
    const length = Math.hypot(backDirection.x, backDirection.y, backDirection.z)
    const padding = options.padding ?? 1.12
    if (!Number.isFinite(length) || length === 0 || !Number.isFinite(options.fov) || options.fov <= 0 || options.fov >= Math.PI ||
      !Number.isFinite(options.aspect) || options.aspect <= 0 || !Number.isFinite(padding) || padding < 1) {
      throw new RangeError("ViewPoint point fit direction, FOV, aspect and padding must be finite and valid")
    }
    const back = new Vector3(backDirection.x / length, backDirection.y / length, backDirection.z / length)
    const right = new Vector3(-back.y, back.x, 0)
    if (right.length() === 0) right.set(1, 0, 0)
    else right.normalize()
    const up = new Vector3().crossVectors(back, right)
    const tangentY = Math.tan(options.fov / 2) / padding
    const tangentX = tangentY * options.aspect
    let originX = 0, originY = 0, originZ = 0
    let count = 0
    let maxRight = -Infinity, maxLeft = -Infinity, maxUp = -Infinity, maxDown = -Infinity
    let minBack = Infinity, maxBack = -Infinity
    for (const point of points) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
        throw new RangeError("ViewPoint fit points must be finite")
      }
      if (count++ === 0) {
        originX = point.x
        originY = point.y
        originZ = point.z
      }
      const x = point.x - originX, y = point.y - originY, z = point.z - originZ
      const r = x * right.x + y * right.y + z * right.z
      const u = x * up.x + y * up.y + z * up.z
      const b = x * back.x + y * back.y + z * back.z
      if (!Number.isFinite(r) || !Number.isFinite(u) || !Number.isFinite(b)) throw new RangeError("ViewPoint fit coordinates exceed finite range")
      maxRight = Math.max(maxRight, r / tangentX + b)
      maxLeft = Math.max(maxLeft, -r / tangentX + b)
      maxUp = Math.max(maxUp, u / tangentY + b)
      maxDown = Math.max(maxDown, -u / tangentY + b)
      minBack = Math.min(minBack, b)
      maxBack = Math.max(maxBack, b)
    }
    if (count === 0) throw new RangeError("ViewPoint point fit requires a non-empty iterable")
    const r = tangentX * (maxRight - maxLeft) * 0.5
    const u = tangentY * (maxUp - maxDown) * 0.5
    const clearance = Math.max(0.001, Math.max(Math.abs(originX), Math.abs(originY), Math.abs(originZ), Math.abs(maxBack)) * Number.EPSILON * 4)
    const eyeBack = Math.max(maxRight * 0.5 + maxLeft * 0.5, maxUp * 0.5 + maxDown * 0.5, maxBack + clearance)
    const targetBack = minBack * 0.5 + maxBack * 0.5
    const world = (b: number) => ({x: originX + right.x * r + up.x * u + back.x * b,
      y: originY + right.y * r + up.y * u + back.y * b, z: originZ + right.z * r + up.z * u + back.z * b})
    const position = world(eyeBack), target = world(targetBack)
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z) ||
      !Number.isFinite(target.x) || !Number.isFinite(target.y) || !Number.isFinite(target.z)) {
      throw new RangeError("ViewPoint fitted point pose exceeds finite coordinates")
    }
    return {position, target}
  }

  /**
  Подбирает позу для world AABB при явно выбранном направлении от target к eye.
  Использует реальный aspect viewport и восемь перспективных ограничений; подходит
  для наклонного обзора и вида сверху. Z-up полюс использует ту же базу, что makeLookAt.
  Возвращает только позу: clip range и момент её применения остаются у автора.
  */
  public static fitPoseForBounds(bounds: ViewPointWorldBounds, backDirection: Readonly<{x: number; y: number; z: number}>, options: ViewPointFitOptions): ViewPointPose {
    for (const axis of ["x", "y", "z"] as const) {
      if (!Number.isFinite(bounds.min[axis]) || !Number.isFinite(bounds.max[axis]) || bounds.min[axis] > bounds.max[axis]) {
        throw new RangeError("ViewPoint fit bounds must be finite and ordered")
      }
    }
    const length = Math.hypot(backDirection.x, backDirection.y, backDirection.z)
    const padding = options.padding ?? 1.12
    if (!Number.isFinite(length) || length === 0 || !Number.isFinite(options.fov) || options.fov <= 0 || options.fov >= Math.PI ||
      !Number.isFinite(options.aspect) || options.aspect <= 0 || !Number.isFinite(padding) || padding < 1) {
      throw new RangeError("ViewPoint fit direction, FOV, aspect and padding must be finite and valid")
    }
    const back = new Vector3(backDirection.x / length, backDirection.y / length, backDirection.z / length)
    const right = new Vector3(-back.y, back.x, 0)
    if (right.length() === 0) right.set(1, 0, 0)
    else right.normalize()
    const up = new Vector3().crossVectors(back, right)
    const target = {
      x: bounds.min.x * 0.5 + bounds.max.x * 0.5,
      y: bounds.min.y * 0.5 + bounds.max.y * 0.5,
      z: bounds.min.z * 0.5 + bounds.max.z * 0.5,
    }
    const tangentY = Math.tan(options.fov / 2)
    const tangentX = tangentY * options.aspect
    let distance = 0.001
    for (let corner = 0; corner < 8; corner++) {
      const x = ((corner & 1) === 0 ? bounds.min.x : bounds.max.x) - target.x
      const y = ((corner & 2) === 0 ? bounds.min.y : bounds.max.y) - target.y
      const z = ((corner & 4) === 0 ? bounds.min.z : bounds.max.z) - target.z
      const depthOffset = x * back.x + y * back.y + z * back.z
      distance = Math.max(distance, depthOffset + 0.001,
        depthOffset + padding * Math.abs(x * right.x + y * right.y + z * right.z) / tangentX,
        depthOffset + padding * Math.abs(x * up.x + y * up.y + z * up.z) / tangentY)
    }
    const position = {x: target.x + back.x * distance, y: target.y + back.y * distance, z: target.z + back.z * distance}
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
      throw new RangeError("ViewPoint fitted pose exceeds finite coordinates")
    }
    return {position, target}
  }

  /**
  Создаёт камеру в фиксированной правой системе Z-up.

  @param parameters - Position и target в мм, fov в радианах, viewport в CSS px.
  @throws Error Если fov или near не положительны либо far не превышает near.
  @example
  ```ts
  const camera = new ViewPoint({position: {x: 0, y: -1000, z: 500}})
  ```
  */
  constructor(parameters: ViewPointParameters) {
    this.viewport = parameters.viewport === undefined
      ? null
      : viewPointClientViewport(parameters.viewport)
    this.fov = parameters.fov ?? 1 // примерно 57 градусов
    this.near = parameters.near ?? 0.1
    this.far = parameters.far ?? 1000
    this.navigation = parameters.navigation ?? "orbit"
    this.flySpeed = parameters.flySpeed ?? 10
    if (this.navigation !== "orbit" && this.navigation !== "fly") throw new RangeError("ViewPoint navigation must be orbit or fly")
    if (!Number.isFinite(this.flySpeed) || this.flySpeed <= 0) throw new RangeError("ViewPoint flySpeed must be finite and positive")

    if (this.fov <= 0) throw new Error("Угол обзора (fov) должен быть больше нуля.")
    if (this.near <= 0) throw new Error("Ближняя плоскость отсечения (near) должна быть больше нуля.")
    if (this.far <= this.near) throw new Error("Дальняя плоскость отсечения (far) должна быть больше ближней (near).")

    this.aspect = this.viewport === null
      ? 1
      : this.viewport.width / this.viewport.height

    this.target = parameters.target
      ? new Vector3(parameters.target.x, parameters.target.y, parameters.target.z)
      : new Vector3(0, 0, 0)
    this.position = parameters.position
      ? new Vector3(parameters.position.x, parameters.position.y, parameters.position.z)
      : new Vector3(10, -10, 10)

    this.updateProjectionMatrix()
    this.update()
  }

  /**
  Возвращает текущую точку фокуса камеры.

  Нужна внешним слоям, которые хотят привязывать UI-объекты
  к экранной окружности вокруг наблюдаемого объекта.
  */
  public getTarget(): Vector3 {
    return this.target
  }

  public setAspectRatio(aspect: number): void {
    if (aspect <= 0) return
    this.aspect = aspect
    this.updateProjectionMatrix()
  }

  /** Обновляет границы Canvas в CSS px и соотношение сторон проекции. */
  public setViewport(viewport: ViewPointClientViewport): void {
    this.viewport = viewPointClientViewport(viewport)
    this.setAspectRatio(this.viewport.width / this.viewport.height)
  }

  public updateProjectionMatrix(): void {
    this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far)
  }

  /**
  Обновляет матрицу вида на основе положения, цели и неизменной мировой оси Z.
  */
  public update = () => {
    this.sanitizePose()
    this.viewMatrix.makeLookAt(this.position, this.target)
  }

  /**
  Вращает положение камеры вокруг цели: азимут вокруг Z и наклон до полюсов.

  Горизонт сохраняется. Команда не регистрирует события и не меняет мировые оси.
  @param deltaX - Конечное горизонтальное смещение указателя в CSS px.
  @param deltaY - Конечное вертикальное смещение в CSS px; наклон ограничен у полюсов.
  @throws RangeError При нечисловой или бесконечной дельте.
  */
  public orbit(deltaX: number, deltaY: number): void {
    finiteControlDelta(deltaX, "orbit deltaX")
    finiteControlDelta(deltaY, "orbit deltaY")
    this.handleRotation(deltaX, deltaY)
    this.update()
  }

  /** Сдвигает камеру и цель в плоскости экрана; дельты заданы в CSS px. */
  public pan(deltaX: number, deltaY: number): void {
    finiteControlDelta(deltaX, "pan deltaX")
    finiteControlDelta(deltaY, "pan deltaY")
    this.handlePan(deltaX, deltaY)
    this.update()
  }

  /** Меняет расстояние до цели; anchor в CSS px сохраняет точку под указателем. */
  public zoom(delta: number, anchor?: {clientX: number; clientY: number}): void {
    finiteControlDelta(delta, "zoom delta")
    if (anchor !== undefined) {
      finiteControlDelta(anchor.clientX, "zoom anchor clientX")
      finiteControlDelta(anchor.clientY, "zoom anchor clientY")
    }
    if (this.navigation === "fly") {
      if (!Number.isFinite(this.flySpeed) || this.flySpeed <= 0) throw new RangeError("ViewPoint flySpeed must be finite and positive")
      this.fly(delta * this.flySpeed, anchor)
    } else {
      this.handleZoom(delta, anchor)
      this.update()
    }
  }

  /** Перемещает eye и target на signed distance в мм вдоль cursor ray; target не является препятствием. */
  public fly(distance: number, anchor?: Readonly<{clientX: number; clientY: number}>): void {
    finiteControlDelta(distance, "fly distance")
    const direction = this.clientDirection(anchor === undefined ? undefined : {x: anchor.clientX, y: anchor.clientY})
    const displacement = direction.multiplyScalar(distance)
    const position = this.position.clone().add(displacement)
    const target = this.target.clone().add(displacement)
    if (!isFiniteVector(position) || !isFiniteVector(target)) throw new RangeError("ViewPoint fly pose exceeds finite coordinates")
    this.position.copy(position)
    this.target.copy(target)
    this.update()
  }

  /** Луч из eye через native client XY, в double и независимо от near/far. */
  public rayForClientPoint(point: Readonly<{x: number; y: number}>): Ray | null {
    finiteControlDelta(point.x, "ray client x")
    finiteControlDelta(point.y, "ray client y")
    if (this.viewport === null) return null
    return new Ray(this.position.clone(), this.clientDirection(point))
  }

  /** Шесть inward world planes для численного visibility query без материализации Display. */
  public frustumPlanes(overscan = 0): readonly ViewPointFrustumPlane[] {
    if (!Number.isFinite(overscan) || overscan < 0) throw new RangeError("ViewPoint frustum overscan must be finite and non-negative")
    const {forward, right, up} = this.viewBasis()
    const tangent = Math.tan(this.fov / 2)
    const tangentX = tangent * this.aspect * (1 + (this.viewport === null ? 0 : 2 * overscan / this.viewport.width))
    const tangentY = tangent * (1 + (this.viewport === null ? 0 : 2 * overscan / this.viewport.height))
    if (!Number.isFinite(tangentX) || !Number.isFinite(tangentY) || tangentX <= 0 || tangentY <= 0 ||
      !Number.isFinite(this.near) || !Number.isFinite(this.far) || this.near <= 0 || this.far <= this.near) {
      throw new RangeError("ViewPoint frustum projection must be finite and valid")
    }
    const plane = (normal: Vector3, offset = 0): ViewPointFrustumPlane => {
      normal.normalize()
      return {normal: {x: normal.x, y: normal.y, z: normal.z}, constant: -normal.dot(this.position) + offset}
    }
    return [plane(forward.clone(), -this.near), plane(forward.clone().negate(), this.far),
      plane(forward.clone().multiplyScalar(tangentX).add(right)),
      plane(forward.clone().multiplyScalar(tangentX).sub(right)),
      plane(forward.clone().multiplyScalar(tangentY).add(up)),
      plane(forward.clone().multiplyScalar(tangentY).sub(up))]
  }

  private viewBasis(): {forward: Vector3; right: Vector3; up: Vector3} {
    const forward = new Vector3().subVectors(this.target, this.position)
    const length = forward.length()
    if (!Number.isFinite(length) || length === 0) throw new RangeError("ViewPoint requires a finite direction from eye to target")
    forward.multiplyScalar(1 / length)
    const right = new Vector3(forward.y, -forward.x, 0)
    if (right.length() === 0) right.set(1, 0, 0)
    else right.normalize()
    const up = new Vector3().crossVectors(right, forward)
    return {forward, right, up}
  }

  private clientDirection(point?: Readonly<{x: number; y: number}>): Vector3 {
    if (point !== undefined) {
      finiteControlDelta(point.x, "client x")
      finiteControlDelta(point.y, "client y")
    }
    const {forward, right, up} = this.viewBasis()
    if (point === undefined || this.viewport === null) return forward
    const tangent = Math.tan(this.fov / 2)
    const x = ((point.x - this.viewport.left) / this.viewport.width * 2 - 1) * tangent * this.aspect
    const y = (1 - (point.y - this.viewport.top) / this.viewport.height * 2) * tangent
    return forward.add(right.multiplyScalar(x)).add(up.multiplyScalar(y)).normalize()
  }

  private handleRotation(deltaX: number, deltaY: number) {
    const offset = new Vector3().subVectors(this.position, this.target)
    const radius = Math.max(offset.length(), LOOK_AT_EPSILON)
    const azimuth = Math.atan2(offset.y, offset.x) - deltaX * 0.005
    const polar = Math.max(1e-4, Math.min(Math.PI - 1e-4,
      Math.acos(Math.max(-1, Math.min(1, offset.z / radius))) - deltaY * 0.005,
    ))
    const horizontalRadius = radius * Math.sin(polar)
    this.position.set(
      this.target.x + horizontalRadius * Math.cos(azimuth),
      this.target.y + horizontalRadius * Math.sin(azimuth),
      this.target.z + radius * Math.cos(polar),
    )
  }

  private handlePan(deltaX: number, deltaY: number) {
    const offset = new Vector3().subVectors(this.position, this.target)
    const panSpeed = 0.001 * offset.length()

    const te = this.viewMatrix.elements
    // Вектор "вправо" камеры находится в первой строке матрицы вида (в column-major это te[0], te[4], te[8])
    const panRight = new Vector3(te[0], te[4], te[8])
    // Вектор "вверх" камеры находится во второй строке матрицы вида (te[1], te[5], te[9])
    const panUp = new Vector3(te[1], te[5], te[9])

    const panDelta = new Vector3()
      .add(panRight.multiplyScalar(deltaX * panSpeed))
      .add(panUp.multiplyScalar(-deltaY * panSpeed))

    // При панорамировании сдвигаем и позицию, и цель
    this.position.add(panDelta)
    this.target.add(panDelta)
  }

  private handleZoom(delta: number, anchor?: {clientX: number; clientY: number}) {
    const offset = new Vector3().subVectors(this.position, this.target)
    const currentRadius = offset.length()
    const scale = Math.pow(0.95, delta * 0.05)
    const minZoomDistance = Math.max(0.001, Math.min(0.1, this.near * 0.02))
    const newRadius = Math.max(minZoomDistance, currentRadius * scale)
    const back = offset.normalize()
    const correction = new Vector3()
    if (anchor !== undefined && this.viewport !== null) {
      const rect = this.viewport
      const ndcX = ((anchor.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = 1 - ((anchor.clientY - rect.top) / rect.height) * 2
      // Та же Z-up ориентация, что у makeLookAt, без Float32 translation
      // и инверсии near/far: их погрешность превращалась в скачки anchor.
      const right = new Vector3(-back.y, back.x, 0)
      if (right.length() === 0) right.set(1, 0, 0)
      else right.normalize()
      const up = new Vector3().crossVectors(back, right)
      const radialDelta = (currentRadius - newRadius) * Math.tan(this.fov / 2)
      correction.add(right.multiplyScalar(ndcX * radialDelta * this.aspect))
      correction.add(up.multiplyScalar(ndcY * radialDelta))
    }
    // Изменение расстояния и сдвиг target-plane anchor вычислены в double.
    this.position.copy(this.target).add(back.multiplyScalar(newRadius)).add(correction)
    this.target.add(correction)
  }

  private sanitizePose(): void {
    const back = new Vector3().subVectors(this.position, this.target)
    if (!isFiniteVector(back) || back.length() < LOOK_AT_EPSILON) {
      const distance = Math.max(this.near * 2, LOOK_AT_EPSILON)
      this.position.copy(this.target).add(new Vector3(0, -distance, 0))
    }
  }
}

function isFiniteVector(v: Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)
}

function finiteControlDelta(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`ViewPoint ${label} must be finite`)
  return value
}

function viewPointClientViewport(value: ViewPointClientViewport): ViewPointClientViewport {
  if (value === null || typeof value !== "object") {
    throw new TypeError("ViewPoint viewport is required")
  }
  const left = finiteViewportValue(value.left, "left")
  const top = finiteViewportValue(value.top, "top")
  const width = positiveViewportValue(value.width, "width")
  const height = positiveViewportValue(value.height, "height")
  return Object.freeze({left, top, width, height})
}

function finiteViewportValue(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`ViewPoint viewport ${label} must be finite`)
  return value
}

function positiveViewportValue(value: number, label: string): number {
  finiteViewportValue(value, label)
  if (value <= 0) throw new RangeError(`ViewPoint viewport ${label} must be positive`)
  return value
}
