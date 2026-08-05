export const recognizedMitigationManagementApi = {
  list: (includeArchived = false) =>
    `national/recognizedMitigation/management?includeArchived=${includeArchived}`,
  detail: (id: number) => `national/recognizedMitigation/management/${id}`,
  create: "national/recognizedMitigation",
  update: (id: number) => `national/recognizedMitigation/${id}`,
  version: (id: number) => `national/recognizedMitigation/${id}/version`,
  archive: (id: number) => `national/recognizedMitigation/${id}/archive`,
};
