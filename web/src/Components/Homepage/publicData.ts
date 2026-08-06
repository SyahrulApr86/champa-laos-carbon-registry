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
