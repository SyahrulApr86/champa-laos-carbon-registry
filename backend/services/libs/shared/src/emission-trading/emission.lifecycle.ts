export type EmissionLifecycleAction =
  | "create"
  | "update"
  | "archive"
  | "void"
  | "reverse";

export interface EmissionLifecycleEvent {
  action: EmissionLifecycleAction;
  at: number;
  actorId: number | null;
  reason: string | null;
  fromStatus: "active" | "archived" | "voided" | "reversed" | null;
  toStatus: "active" | "archived" | "voided" | "reversed";
}

export const SETTLED_TRADE_STATUSES = ["settled", "completed", "finalized"] as const;

export const isSettledTrade = (status?: string | null) =>
  SETTLED_TRADE_STATUSES.includes(
    (status || "").toLowerCase() as (typeof SETTLED_TRADE_STATUSES)[number]
  );
