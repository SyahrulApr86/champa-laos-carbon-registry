const BASE = "national/climateFinance";

const withQuery = (path: string, params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, value);
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
};

export const climateFinanceManagementApi = {
  list: (params: { q?: string; includeArchived?: boolean }) =>
    withQuery(`${BASE}/management`, {
      q: params.q,
      includeArchived: String(params.includeArchived ?? false),
      page: "1",
      pageSize: "100",
    }),
  detail: (id: number) => `${BASE}/management/${id}`,
  update: (id: number) => `${BASE}/${id}`,
  archive: (id: number) => `${BASE}/${id}/archive`,
  remove: (id: number) => `${BASE}/${id}`,
};
