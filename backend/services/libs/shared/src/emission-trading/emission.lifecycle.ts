export const EMISSION_LIFECYCLE_ACTIONS = [
  "archive",
  "restore",
  "void",
  "reverse",
] as const;

export type EmissionLifecycleAction = (typeof EMISSION_LIFECYCLE_ACTIONS)[number];

export type EmissionLifecycleEventAction =
  | "created"
  | "updated"
  | "archived"
  | "restored"
  | "voided"
  | "reversed";

export type EmissionLifecycleStatus =
  | "active"
  | "archived"
  | "voided"
  | "reversed";

export interface EmissionLifecycleEvent {
  action: EmissionLifecycleEventAction;
  changes?: Record<string, unknown>;
  relatedRecordId?: number;
  reason: string | null;
  actorId: number | null;
  at: number;
}

export const SETTLED_TRADE_STATUSES = [
  "settled",
  "completed",
  "finalized",
] as const;

export function isSettledTrade(settlementStatus?: string | null): boolean {
  return SETTLED_TRADE_STATUSES.includes(
    (settlementStatus || "").toLowerCase() as (typeof SETTLED_TRADE_STATUSES)[number]
  );
}
