export const ndcTargetManagementApi = {
  list: (includeArchived = false) =>
    `national/ndcTarget/management?includeArchived=${includeArchived}`,
  detail: (id: number) => `national/ndcTarget/management/${id}`,
  create: "national/ndcTarget",
  update: (id: number) => `national/ndcTarget/${id}`,
  version: (id: number) => `national/ndcTarget/${id}/version`,
  archive: (id: number) => `national/ndcTarget/${id}/archive`,
};
