import type { DeviceAdapter, DeviceInfo, DeviceStatus, HardwareAdapters } from "./types";
import { createDefaultAdapters } from "./simulators";

const VALID: DeviceStatus[] = ["simulated", "connected", "disconnected"];

/** Maps an adapter's check result to display info. Unknown/failed checks are treated as disconnected. */
export function describeStatus(adapter: DeviceAdapter, status: unknown): DeviceInfo {
  const safe: DeviceStatus = VALID.includes(status as DeviceStatus) ? (status as DeviceStatus) : "disconnected";
  const detail =
    safe === "connected"
      ? "Physical device verified by adapter."
      : safe === "simulated"
        ? "Demo simulator — values are not real readings. Use manual entry for clinical data."
        : "No physical device connected.";
  return { kind: adapter.kind, label: adapter.label, status: safe, demoOnly: safe !== "connected", detail };
}

export const ORDER = ["rfid", "temperature", "pulse_oximeter", "oled", "buzzer"] as const;

export function createHardwareService(adapters: HardwareAdapters = createDefaultAdapters()) {
  return {
    adapters,
    async getStatus(): Promise<DeviceInfo[]> {
      return Promise.all(
        ORDER.map(async (k) => {
          const a = adapters[k];
          try {
            return describeStatus(a, await a.checkStatus());
          } catch {
            return describeStatus(a, "disconnected");
          }
        }),
      );
    },
  };
}

export type HardwareService = ReturnType<typeof createHardwareService>;
export const hardwareService = createHardwareService();
