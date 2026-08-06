export interface PublicMeta {
  disclosure?: string;
  availability?: string;
  source?: { type?: string; label?: string };
  pagination?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    total_pages?: number;
  };
  [key: string]: unknown;
}

export interface PublicEnvelope<T> {
  data: T;
  meta?: PublicMeta;
}

const PUBLIC_ENUM_LABELS: Record<string, string> = {
  active: "Active",
  active_demo: "Active (demo)",
  archived: "Archived",
  completed: "Completed",
  configured: "Configured",
  finalized: "Finalized",
  not_applicable: "Not applicable",
  not_configured: "Not configured",
  pending: "Pending",
  reversed: "Reversed",
  settled: "Settled",
  synthetic_demo: "Synthetic demonstration",
  unallocated: "Unallocated",
  voided: "Voided",
  withheld: "Withheld",
};

export const formatPublicEnum = (value?: string | null) => {
  if (!value) return "Not available";
  return PUBLIC_ENUM_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const formatPublicDate = (value?: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
};

/**
 * Accept both the raw HTTP envelope and ConnectionContext's unwrapped value.
 * The connection keeps the original Axios response under `response`, while
 * exposing `data` as the envelope's data member for legacy callers.
 */
export const readPublicEnvelope = <T,>(response: unknown): PublicEnvelope<T> => {
  const connection = response as {
    data?: unknown;
    response?: { data?: unknown };
  };

  const isEnvelope = (value: unknown): value is PublicEnvelope<T> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return "data" in value && "meta" in value;
  };

  if (isEnvelope(response)) return response;
  if (isEnvelope(connection.response?.data)) return connection.response.data;

  return { data: (connection.data ?? response) as T };
};
