export const reddPlusManagementApi = {
  list: (includeArchived = false) =>
    `national/reddPlus/management?includeArchived=${includeArchived}`,
  detail: (id: number) => `national/reddPlus/management/${id}`,
  create: "national/reddPlus",
  update: (id: number) => `national/reddPlus/${id}`,
  version: (id: number) => `national/reddPlus/${id}/version`,
  archive: (id: number) => `national/reddPlus/${id}/archive`,
};
