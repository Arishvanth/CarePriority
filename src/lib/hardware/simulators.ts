import type {
  ActionResult, BuzzerAdapter, HardwareAdapters, OledAdapter, PulseOximeterAdapter, RfidAdapter, TemperatureAdapter,
} from "./types";

const notConnected = (label: string): ActionResult<never> => ({
  ok: false,
  reason: "not_connected",
  message: `${label} is not connected — no physical device is available.`,
});

/** Deterministic-enough demo values; never presented as real readings. */
export function createRfidSimulator(random = Math.random): RfidAdapter {
  return {
    kind: "rfid",
    label: "RFID reader",
    checkStatus: async () => "simulated",
    readTag: async () => ({
      ok: true,
      simulated: true,
      value: `RF-${Math.floor(random() * 0xffff).toString(16).toUpperCase().padStart(4, "0")}`,
    }),
  };
}

export function createTemperatureSimulator(random = Math.random): TemperatureAdapter {
  return {
    kind: "temperature",
    label: "Temperature sensor",
    checkStatus: async () => "simulated",
    readTemperature: async () => ({ ok: true, simulated: true, value: Math.round((36.4 + random() * 1.2) * 10) / 10 }),
  };
}

export function createPulseOxSimulator(random = Math.random): PulseOximeterAdapter {
  return {
    kind: "pulse_oximeter",
    label: "Pulse oximeter",
    checkStatus: async () => "simulated",
    readPulseOx: async () => ({
      ok: true,
      simulated: true,
      value: { heartRate: 64 + Math.floor(random() * 30), spo2: 95 + Math.floor(random() * 5) },
    }),
  };
}

/** Output devices: no physical effect is faked — actions return not_connected. */
export function createOledPlaceholder(): OledAdapter {
  return {
    kind: "oled",
    label: "OLED display",
    checkStatus: async () => "disconnected",
    showText: async () => notConnected("OLED display"),
  };
}

export function createBuzzerPlaceholder(): BuzzerAdapter {
  return {
    kind: "buzzer",
    label: "Buzzer",
    checkStatus: async () => "disconnected",
    beep: async () => notConnected("Buzzer"),
  };
}

export function createDefaultAdapters(): HardwareAdapters {
  return {
    rfid: createRfidSimulator(),
    temperature: createTemperatureSimulator(),
    pulse_oximeter: createPulseOxSimulator(),
    oled: createOledPlaceholder(),
    buzzer: createBuzzerPlaceholder(),
  };
}
