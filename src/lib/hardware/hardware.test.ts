import { describe, expect, it } from "vitest";
import { createHardwareService, describeStatus } from "./service";
import {
  createBuzzerPlaceholder,
  createOledPlaceholder,
  createPulseOxSimulator,
  createRfidSimulator,
  createTemperatureSimulator,
} from "./simulators";
import type { HardwareAdapters, TemperatureAdapter } from "./types";

describe("describeStatus", () => {
  const a = createRfidSimulator();
  it("maps simulated as demo-only", () => {
    expect(describeStatus(a, "simulated")).toMatchObject({ status: "simulated", demoOnly: true });
  });
  it("only connected is non-demo", () => {
    expect(describeStatus(a, "connected")).toMatchObject({ status: "connected", demoOnly: false });
  });
  it("unknown values fall back to disconnected", () => {
    expect(describeStatus(a, "yes")).toMatchObject({ status: "disconnected", demoOnly: true });
  });
});

describe("simulators", () => {
  const fixed = () => 0.5;
  it("never report connected and flag readings as simulated", async () => {
    const svc = createHardwareService();
    const all = await svc.getStatus();
    expect(all.map((d) => d.kind)).toEqual([
      "rfid",
      "temperature",
      "pulse_oximeter",
      "oled",
      "buzzer",
    ]);
    expect(all.every((d) => d.status !== "connected")).toBe(true);
  });
  it("produce plausible simulated readings", async () => {
    const tag = await createRfidSimulator(fixed).readTag();
    expect(tag).toEqual({ ok: true, simulated: true, value: "RF-7FFF" });
    const t = await createTemperatureSimulator(fixed).readTemperature();
    expect(t).toEqual({ ok: true, simulated: true, value: 37 });
    const p = await createPulseOxSimulator(fixed).readPulseOx();
    expect(p).toEqual({ ok: true, simulated: true, value: { heartRate: 79, spo2: 97 } });
  });
  it("output devices return not_connected instead of faking", async () => {
    expect(await createOledPlaceholder().showText(["hi"])).toMatchObject({
      ok: false,
      reason: "not_connected",
    });
    expect(await createBuzzerPlaceholder().beep("alert")).toMatchObject({
      ok: false,
      reason: "not_connected",
    });
  });
  it("a throwing check is reported disconnected", async () => {
    const broken: TemperatureAdapter = {
      ...createTemperatureSimulator(),
      checkStatus: async () => {
        throw new Error("x");
      },
    };
    const adapters: HardwareAdapters = {
      rfid: createRfidSimulator(),
      temperature: broken,
      pulse_oximeter: createPulseOxSimulator(),
      oled: createOledPlaceholder(),
      buzzer: createBuzzerPlaceholder(),
    };
    const s = await createHardwareService(adapters).getStatus();
    expect(s[1].status).toBe("disconnected");
  });
});
