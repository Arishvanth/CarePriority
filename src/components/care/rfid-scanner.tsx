import { useEffect, useRef, useState } from "react";
import { Radio, ScanLine, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ScanState = "idle" | "scanning" | "found" | "failed";

interface RfidScannerProps {
  /** Called with a raw tag (from the reader or manual entry). */
  onScan: (tag: string) => void | Promise<void>;
  state: ScanState;
  message?: string;
  className?: string;
  /** Optional label override for the primary action. */
  label?: string;
}

/**
 * RFID wristband capture. Hardware readers behave as keyboards: they type the
 * tag then press Enter. The hidden input captures that; manual search is the
 * documented fallback when a wristband will not read.
 */
export function RfidScanner({ onScan, state, message, className, label = "Scan wristband" }: RfidScannerProps) {
  const [manual, setManual] = useState(false);
  const [value, setValue] = useState("");
  const captureRef = useRef<HTMLInputElement>(null);
  const manualRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state === "scanning") captureRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (manual) manualRef.current?.focus();
  }, [manual]);

  function submit(tag: string) {
    const clean = tag.trim();
    if (!clean) return;
    void onScan(clean);
    setValue("");
  }

  const tone =
    state === "found"
      ? "border-success/40 bg-success-soft"
      : state === "failed"
        ? "border-danger/40 bg-danger-soft"
        : state === "scanning"
          ? "border-primary/40 bg-primary-light"
          : "border-border bg-muted/40";

  return (
    <div className={cn("rounded-xl border p-4 transition-colors", tone, className)}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary shadow-xs",
            state === "scanning" && "animate-pulse-soft",
          )}
          aria-hidden="true"
        >
          <Radio className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">RFID wristband</p>
          <p className="truncate text-xs text-muted-foreground">
            {message ??
              (state === "scanning" ? "Hold the wristband near the reader…" : "Tap to scan or search manually.")}
          </p>
        </div>
      </div>

      {/* Hardware readers emit keystrokes + Enter into this field. */}
      <label className="sr-only" htmlFor="rfid-capture">
        RFID reader input
      </label>
      <input
        id="rfid-capture"
        ref={captureRef}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        onKeyDown={(e) => {
          if (e.key === "Enter") submit((e.target as HTMLInputElement).value);
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="soft"
          onClick={() => {
            setManual(false);
            captureRef.current?.focus();
            void onScan("__scan__");
          }}
        >
          <ScanLine className="h-3.5 w-3.5" /> {label}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setManual((m) => !m)}>
          {manual ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
          {manual ? "Cancel" : "Enter manually"}
        </Button>
      </div>

      {manual && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <Input
            ref={manualRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="RF-88A2 or patient name"
            className="h-9 font-mono text-sm"
            aria-label="Manual RFID or patient search"
          />
          <Button type="submit" size="sm">
            Find
          </Button>
        </form>
      )}
    </div>
  );
}
