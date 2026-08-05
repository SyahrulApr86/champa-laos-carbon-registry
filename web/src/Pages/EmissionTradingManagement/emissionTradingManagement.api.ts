const MANAGEMENT_BASE = "national/emissionTrading/management";

const withQuery = (
  resource: string,
  page = 1,
  pageSize = 25,
  search?: string,
  status?: string
) => {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);
  if (status && status !== "all") query.set("status", status);
  return `${MANAGEMENT_BASE}/${resource}?${query.toString()}`;
};

export const EMISSION_TRADING_MANAGEMENT_API = {
  ceilings: {
    list: (page = 1, pageSize = 25, search?: string, status?: string) =>
      withQuery("ceilings", page, pageSize, search, status),
    detail: (id: number) => `${MANAGEMENT_BASE}/ceilings/${id}`,
    history: (id: number) => `${MANAGEMENT_BASE}/ceilings/${id}/history`,
    update: (id: number) => `${MANAGEMENT_BASE}/ceilings/${id}`,
    archive: (id: number) => `${MANAGEMENT_BASE}/ceilings/${id}/archive`,
  },
  participants: {
    list: (page = 1, pageSize = 25, search?: string, status?: string) =>
      withQuery("participants", page, pageSize, search, status),
    detail: (id: number) => `${MANAGEMENT_BASE}/participants/${id}`,
    history: (id: number) => `${MANAGEMENT_BASE}/participants/${id}/history`,
    update: (id: number) => `${MANAGEMENT_BASE}/participants/${id}`,
    archive: (id: number) => `${MANAGEMENT_BASE}/participants/${id}/archive`,
  },
  trades: {
    list: (page = 1, pageSize = 25, search?: string, status?: string) =>
      withQuery("trades", page, pageSize, search, status),
    detail: (id: number) => `${MANAGEMENT_BASE}/trades/${id}`,
    history: (id: number) => `${MANAGEMENT_BASE}/trades/${id}/history`,
    update: (id: number) => `${MANAGEMENT_BASE}/trades/${id}`,
    void: (id: number) => `${MANAGEMENT_BASE}/trades/${id}/void`,
    reverse: (id: number) => `${MANAGEMENT_BASE}/trades/${id}/reverse`,
  },
} as const;

export type EmissionManagementKind = keyof typeof EMISSION_TRADING_MANAGEMENT_API;

export const EMISSION_MARKET_UNITS = ["tCO2e"] as const;
export const EMISSION_MARKET_CURRENCIES = ["LAK"] as const;
export const EMISSION_MARKET_VENUES = [
  "synthetic_demo",
  "configured",
  "not_configured",
] as const;
