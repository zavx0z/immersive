import {expect, test} from "bun:test"
import {resolve} from "node:path"

const uiRoot = resolve(import.meta.dir, "..")

test("[UI-ICONS-001] элементы управления используют SVG или Path вместо текстовых глифов", async () => {
  const [selectField, collectionField, breadcrumbs, iconAssets] = await Promise.all([
    Bun.file(resolve(uiRoot, "field/select/index.tsx")).text(),
    Bun.file(resolve(uiRoot, "field/collection/index.tsx")).text(),
    Bun.file(resolve(uiRoot, "navigation/breadcrumb/src/helpers.tsx")).text(),
    Bun.file(Bun.resolveSync("@zavx0z/immersive-ui-theme-icon", uiRoot)).text(),
  ])

  expect(selectField).not.toContain("data-select-field-indicator")
  expect(selectField).not.toContain("chevronDownIcon")

  expect(collectionField).not.toContain('label="↑"')
  expect(collectionField).not.toContain('label="↓"')
  expect(collectionField).toContain("iconSrc={arrowUpIcon}")
  expect(collectionField).toContain("iconSrc={arrowDownIcon}")

  expect(breadcrumbs).not.toContain("›")
  expect(breadcrumbs).toContain("src={chevronRightIcon}")

  expect(iconAssets).toContain("default as arrowUpIcon")
  expect(iconAssets).toContain("default as arrowDownIcon")
})
