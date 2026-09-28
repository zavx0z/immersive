import {describe, expect, test} from "bun:test"
import {planSlots, type PlanSlotsInput, type PlanSlotsOutput} from "@zavx0z/template/slot"

describe.each([
  {
    name: "Отсутствующие дети",
    props: {outlets: ["header"], children: [undefined, {slot: "header"}, undefined]},
    expected: {slots: [{name: "header", children: [1]}]},
  },
  {
    name: "Нет точек вставки и детей",
    props: {outlets: [], children: []},
    expected: {slots: []},
  },
  {
    name: "Пустая безымянная область",
    props: {outlets: [""], children: []},
    expected: {slots: [{name: "", children: []}]},
  },
  {
    name: "Безымянное вложенное содержимое",
    props: {outlets: [""], children: [{}, {slot: ""}, {slot: undefined}]},
    expected: {slots: [{name: "", children: [0, 1, 2]}]},
  },
  {
    name: "Именованное содержимое без безымянной области",
    props: {outlets: ["header"], children: [{slot: "header"}]},
    expected: {slots: [{name: "header", children: [0]}]},
  },
  {
    name: "Области в порядке получателя",
    props: {
      outlets: ["footer", "", "header"],
      children: [{slot: "header"}, {}, {slot: "footer"}],
    },
    expected: {
      slots: [
        {name: "footer", children: [2]},
        {name: "", children: [1]},
        {name: "header", children: [0]},
      ],
    },
  },
  {
    name: "Несколько детей и незаполненная область",
    props: {
      outlets: ["header", "", "footer", "aside"],
      children: [{slot: "header"}, {}, {slot: "header"}, {slot: "footer"}, {}],
    },
    expected: {
      slots: [
        {name: "header", children: [0, 2]},
        {name: "", children: [1, 4]},
        {name: "footer", children: [3]},
        {name: "aside", children: []},
      ],
    },
  },
  {
    name: "Точное сравнение имён",
    props: {
      outlets: ["Header", "header", " header ", "__proto__"],
      children: [{slot: "__proto__"}, {slot: " header "}, {slot: "header"}, {slot: "Header"}],
    },
    expected: {
      slots: [
        {name: "Header", children: [3]},
        {name: "header", children: [2]},
        {name: " header ", children: [1]},
        {name: "__proto__", children: [0]},
      ],
    },
  },
])("$name", ({props, expected}: {props: PlanSlotsInput; expected: PlanSlotsOutput}) => {
  const original = {
    outlets: props.outlets.slice(),
    children: props.children.map(child => child === undefined ? undefined : {...child}),
  }
  const actual = planSlots(props)

  test("Распределение содержимого", () => {
    expect(
      actual,
      "План раскрывает все объявленные области и исходные индексы вложенных детей, назначенных каждой области.",
    ).toEqual(expected)
  })

  test("Порядок точек вставки", () => {
    expect(
      actual.slots.map(slot => slot.name),
      "Порядок областей задаёт получатель через outlets, независимо от порядка назначений в children.",
    ).toEqual([...props.outlets])
  })

  test("Каждый ребёнок назначен один раз", () => {
    expect(
      actual.slots.flatMap(slot => slot.children).toSorted((left, right) => left - right),
      "Индекс каждого существующего ребёнка присутствует в одной области; undefined пропускается без назначения.",
    ).toEqual(props.children.flatMap((child, index) => child === undefined ? [] : [index]))
  })

  test("Сохранение входных данных", () => {
    expect(
      props,
      "Расчёт создаёт собственные коллекции плана и сохраняет объявления и назначения вызывающего кода.",
    ).toEqual(original)
  })

  /** @remarks Безымянная область применима только когда получатель объявил пустое имя. */
  describe.skipIf(!props.outlets.includes(""))("Безымянная область", () => {
    test("Неявное и пустое назначение", () => {
      expect(
        actual.slots.find(slot => slot.name === "")?.children,
        "Ребёнок без slot и ребёнок с slot равным пустой строке назначаются одной безымянной области.",
      ).toEqual(expected.slots.find(slot => slot.name === "")?.children)
    })
  })

  /** @remarks Именованные назначения применимы только при наличии непустых имён в outlets. */
  describe.skipIf(!props.outlets.some(name => name !== ""))("Именованные области", () => {
    test("Назначение по точному имени", () => {
      expect(
        actual.slots.filter(slot => slot.name !== ""),
        "Именованные области получают только детей с совпадающим slot; регистр, пробелы и специальные имена сохраняются.",
      ).toEqual(expected.slots.filter(slot => slot.name !== ""))
    })
  })

  /** @remarks Пустые области рассматриваются в вариантах, где хотя бы одно объявление не получило детей. */
  describe.skipIf(!expected.slots.some(slot => slot.children.length === 0))("Пустые области", () => {
    test("Сохранение незаполненной точки вставки", () => {
      expect(
        actual.slots.filter(slot => slot.children.length === 0),
        "Объявление остаётся в плане с пустым children; потребитель может отдельно решить, какое fallback-содержимое вставить.",
      ).toEqual(expected.slots.filter(slot => slot.children.length === 0))
    })
  })

  /** @remarks Авторский порядок внутри области проверяется в вариантах с несколькими назначенными детьми. */
  describe.skipIf(!expected.slots.some(slot => slot.children.length > 1))("Несколько детей области", () => {
    test("Авторский порядок детей", () => {
      expect(
        actual.slots.filter(slot => slot.children.length > 1),
        "Индексы одной области следуют исходному children, даже когда между ними находятся назначения других областей.",
      ).toEqual(expected.slots.filter(slot => slot.children.length > 1))
    })
  })
})
