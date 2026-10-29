import { useSyncExternalStore } from "react";

/**
 * Shared live-sync (realtime) connection status.
 *
 * One realtime subscription (owned by the app shell) writes here; any screen
 * reads it, so no screen ever claims "live" unless that channel is subscribed.
 */
export type LiveSyncStatus = "connecting" | "live" | "reconnecting" | "disconnected" | "error";

/** Channel states reported by the realtime client's subscribe callback. */
export type ChannelState = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

/** Pure transition: the status after the channel reports `state`. */
export function nextLiveStatus(prev: LiveSyncStatus, state: string): LiveSyncStatus {
  switch (state) {
    case "SUBSCRIBED":
      return "live";
    case "TIMED_OUT":
      // The client keeps retrying the join; before the first success we are still connecting.
      return prev === "connecting" ? "connecting" : "reconnecting";
    case "CLOSED":
      return "disconnected";
    case "CHANNEL_ERROR":
      return "error";
    default:
      return prev;
  }
}

/** True when the channel just recovered after a drop, so missed changes must be refetched. */
export function shouldRefreshOnRecovery(prev: LiveSyncStatus, next: LiveSyncStatus): boolean {
  return next === "live" && (prev === "reconnecting" || prev === "disconnected" || prev === "error");
}

export type LiveSyncTone = "ok" | "pending" | "warning";

export interface LiveSyncMeta {
  /** Short label for compact badges. */
  short: string;
  /** Longer explanatory sentence. */
  long: string;
  tone: LiveSyncTone;
  /** Only true when the realtime channel is actually subscribed. */
  isLive: boolean;
}

const META: Record<LiveSyncStatus, LiveSyncMeta> = {
  live: {
    short: "Realtime live",
    long: "Live sync active",
    tone: "ok",
    isLive: true,
  },
  connecting: {
    short: "Connecting…",
    long: "Connecting live sync…",
    tone: "pending",
    isLive: false,
  },
  reconnecting: {
    short: "Reconnecting…",
    long: "Live sync interrupted — reconnecting. Data refreshes automatically.",
    tone: "warning",
    isLive: false,
  },
  disconnected: {
    short: "Sync disconnected",
    long: "Live sync disconnected — refreshing data automatically.",
    tone: "warning",
    isLive: false,
  },
  error: {
    short: "Sync error",
    long: "Live sync error — retrying. Refresh the page if this persists.",
    tone: "warning",
    isLive: false,
  },
};

export function liveSyncMeta(status: LiveSyncStatus): LiveSyncMeta {
  return META[status];
}

// --- tiny external store -------------------------------------------------

let current: LiveSyncStatus = "connecting";
const listeners = new Set<() => void>();

export function getLiveSyncStatus(): LiveSyncStatus {
  return current;
}

export function setLiveSyncStatus(next: LiveSyncStatus): void {
  if (next === current) return;
  current = next;
  for (const listener of listeners) listener();
}

export function subscribeLiveSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the shared live-sync status (SSR renders "connecting", never "live"). */
export function useLiveSyncStatus(): LiveSyncStatus {
  return useSyncExternalStore(subscribeLiveSync, getLiveSyncStatus, () => "connecting");
}
