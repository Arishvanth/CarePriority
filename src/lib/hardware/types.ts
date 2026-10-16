/** Hardware abstraction layer types. No adapter may report "connected" without a real connection check. */
export type DeviceKind = "rfid" | "temperature" | "pulse_oximeter" | "oled" | "buzzer";
export type DeviceStatus = "simulated" | "connected" | "disconnected";

export interface DeviceInfo {
  kind: DeviceKind;
  label: string;
  status: DeviceStatus;
  /** True only when values come from a simulator or manual entry. */
  demoOnly: boolean;
  detail: string;
}

export type ActionResult<T = void> =
  | { ok: true; value: T; simulated: boolean }
  | { ok: false; reason: "not_connected" | "unsupported" | "error"; message: string };

export interface DeviceAdapter {
  readonly kind: DeviceKind;
  readonly label: string;
  /** Performs the adapter's real connection check (simulators report "simulated"). */
  checkStatus(): Promise<DeviceStatus>;
}

export interface RfidAdapter extends DeviceAdapter {
  readonly kind: "rfid";
  readTag(): Promise<ActionResult<string>>;
}
export interface TemperatureAdapter extends DeviceAdapter {
  readonly kind: "temperature";
  readTemperature(): Promise<ActionResult<number>>;
}
export interface PulseOximeterAdapter extends DeviceAdapter {
  readonly kind: "pulse_oximeter";
  readPulseOx(): Promise<ActionResult<{ heartRate: number; spo2: number }>>;
}
export interface OledAdapter extends DeviceAdapter {
  readonly kind: "oled";
  showText(lines: string[]): Promise<ActionResult>;
}
export interface BuzzerAdapter extends DeviceAdapter {
  readonly kind: "buzzer";
  beep(pattern: "short" | "long" | "alert"): Promise<ActionResult>;
}

export interface HardwareAdapters {
  rfid: RfidAdapter;
  temperature: TemperatureAdapter;
  pulse_oximeter: PulseOximeterAdapter;
  oled: OledAdapter;
  buzzer: BuzzerAdapter;
}
