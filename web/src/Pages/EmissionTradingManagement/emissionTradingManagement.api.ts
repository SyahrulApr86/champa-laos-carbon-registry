const BASE = "national/emissionTrading/management";
const list = (resource: string, page = 1, pageSize = 50, search?: string, status?: string) => {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);
  if (status && status !== "all") query.set("status", status);
  return `${BASE}/${resource}?${query.toString()}`;
};

export const EMISSION_TRADING_MANAGEMENT_API = {
  ceilings: { list: (p?: number, s?: number, q?: string, status?: string) => list("ceilings", p, s, q, status), detail: (id: number) => `${BASE}/ceilings/${id}`, history: (id: number) => `${BASE}/ceilings/${id}/history`, update: (id: number) => `${BASE}/ceilings/${id}`, archive: (id: number) => `${BASE}/ceilings/${id}/archive` },
  participants: { list: (p?: number, s?: number, q?: string, status?: string) => list("participants", p, s, q, status), detail: (id: number) => `${BASE}/participants/${id}`, history: (id: number) => `${BASE}/participants/${id}/history`, update: (id: number) => `${BASE}/participants/${id}`, archive: (id: number) => `${BASE}/participants/${id}/archive` },
  trades: { list: (p?: number, s?: number, q?: string, status?: string) => list("trades", p, s, q, status), detail: (id: number) => `${BASE}/trades/${id}`, history: (id: number) => `${BASE}/trades/${id}/history`, update: (id: number) => `${BASE}/trades/${id}`, void: (id: number) => `${BASE}/trades/${id}/void`, reverse: (id: number) => `${BASE}/trades/${id}/reverse` },
} as const;

export type EmissionManagementKind = keyof typeof EMISSION_TRADING_MANAGEMENT_API;
