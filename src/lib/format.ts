export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function waitMinutes(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function nextPatientCode(): string {
  return `P-${Math.floor(2000 + Math.random() * 8000)}`;
}

export function randomRfid(): string {
  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
  return `RF-${hex}`;
}
