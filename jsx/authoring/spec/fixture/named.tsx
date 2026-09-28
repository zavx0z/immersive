export function Panel() {
  return <section>
    <slot name="header" />
    <slot />
  </section>
}
