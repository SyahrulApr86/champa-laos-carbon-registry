const BASE = "national/technologyTransfer";

export const technologyTransferManagementApi = {
  list: (params: { q?: string; includeArchived?: boolean }) => {
    const query = new URLSearchParams({
      page: "1",
      pageSize: "100",
      includeArchived: String(params.includeArchived ?? false),
    });
    if (params.q) query.set("q", params.q);
    return `${BASE}/management?${query.toString()}`;
  },
  detail: (id: number) => `${BASE}/management/${id}`,
  update: (id: number) => `${BASE}/${id}`,
  archive: (id: number) => `${BASE}/${id}/archive`,
  remove: (id: number) => `${BASE}/${id}`,
};
