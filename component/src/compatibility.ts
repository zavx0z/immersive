/** Reference ledger сохраняет неподтверждённые случаи явно после смены исполнения. */
import data from "../compatibility.json"
export type CompatibilityStatus = "supported" | "unsupported" | "unverified"
export type CapabilityStatus = "implemented" | "partial" | "unsupported" | "not-applicable" | "unverified"
export const reactCompatibility = Object.freeze({
  ...data,
  features: Object.freeze(data.features),
  hooks: Object.freeze(data.hooks),
  capabilities: Object.freeze(data.capabilities),
})
export type ReactCompatibilityManifest = typeof reactCompatibility
