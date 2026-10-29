import { afterEach, describe, expect, it } from "vitest";
import {
  getLiveSyncStatus,
  liveSyncMeta,
  nextLiveStatus,
  setLiveSyncStatus,
  shouldRefreshOnRecovery,
  subscribeLiveSync,
  type LiveSyncStatus,
} from "./live-sync";

const ALL: LiveSyncStatus[] = ["connecting", "live", "reconnecting", "disconnected", "error"];

afterEach(() => setLiveSyncStatus("connecting"));

describe("live-sync labels", () => {
  it("only the live status claims realtime is live", () => {
    for (const s of ALL) {
      const meta = liveSyncMeta(s);
      expect(meta.isLive).toBe(s === "live");
      if (s !== "live") {
        expect(meta.short.toLowerCase()).not.toContain("live");
        expect(meta.long.toLowerCase()).not.toContain("active");
      }
    }
  });

  it("maps each state to its label", () => {
    expect(liveSyncMeta("live").short).toBe("Realtime live");
    expect(liveSyncMeta("connecting").short).toBe("Connecting…");
    expect(liveSyncMeta("reconnecting").short).toBe("Reconnecting…");
    expect(liveSyncMeta("disconnected").short).toBe("Sync disconnected");
    expect(liveSyncMeta("error").short).toBe("Sync error");
  });

  it("uses warning tone for every dropped state", () => {
    expect(liveSyncMeta("live").tone).toBe("ok");
    expect(liveSyncMeta("connecting").tone).toBe("pending");
    for (const s of ["reconnecting", "disconnected", "error"] as const) {
      expect(liveSyncMeta(s).tone).toBe("warning");
    }
  });
});

describe("live-sync transitions", () => {
  it("SUBSCRIBED makes it live from any state", () => {
    for (const s of ALL) expect(nextLiveStatus(s, "SUBSCRIBED")).toBe("live");
  });

  it("a timeout before the first join stays connecting, after a join it is reconnecting", () => {
    expect(nextLiveStatus("connecting", "TIMED_OUT")).toBe("connecting");
    expect(nextLiveStatus("live", "TIMED_OUT")).toBe("reconnecting");
    expect(nextLiveStatus("error", "TIMED_OUT")).toBe("reconnecting");
  });

  it("CLOSED is disconnected and CHANNEL_ERROR is error", () => {
    expect(nextLiveStatus("live", "CLOSED")).toBe("disconnected");
    expect(nextLiveStatus("live", "CHANNEL_ERROR")).toBe("error");
    expect(nextLiveStatus("connecting", "CHANNEL_ERROR")).toBe("error");
  });

  it("unknown channel states leave the status unchanged", () => {
    expect(nextLiveStatus("live", "JOINING")).toBe("live");
  });

  it("walks a drop → reconnect → recover sequence and refreshes exactly once", () => {
    let s: LiveSyncStatus = "connecting";
    const refreshes: string[] = [];
    for (const state of ["SUBSCRIBED", "CHANNEL_ERROR", "TIMED_OUT", "SUBSCRIBED", "SUBSCRIBED"]) {
      const next = nextLiveStatus(s, state);
      if (shouldRefreshOnRecovery(s, next)) refreshes.push(state);
      s = next;
    }
    expect(s).toBe("live");
    expect(refreshes).toHaveLength(1);
  });

  it("does not refresh on the very first successful join", () => {
    expect(shouldRefreshOnRecovery("connecting", "live")).toBe(false);
    expect(shouldRefreshOnRecovery("live", "live")).toBe(false);
    expect(shouldRefreshOnRecovery("disconnected", "live")).toBe(true);
  });
});

describe("shared live-sync store", () => {
  it("starts as connecting, never live", () => {
    expect(getLiveSyncStatus()).toBe("connecting");
  });

  it("notifies subscribers on change only", () => {
    let calls = 0;
    const unsubscribe = subscribeLiveSync(() => calls++);
    setLiveSyncStatus("live");
    setLiveSyncStatus("live");
    setLiveSyncStatus("error");
    unsubscribe();
    setLiveSyncStatus("live");
    expect(calls).toBe(2);
    expect(getLiveSyncStatus()).toBe("live");
  });
});
