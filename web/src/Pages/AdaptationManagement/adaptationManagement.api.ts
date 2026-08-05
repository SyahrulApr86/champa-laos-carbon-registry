export const ADAPTATION_MANAGEMENT_API = {
  list: (includeArchived = false) =>
    `national/adaptation/management${includeArchived ? "?includeArchived=true" : ""}`,
  detail: (id: number) => `national/adaptation/management/${id}`,
  update: (id: number) => `national/adaptation/${id}`,
  stage: (id: number) => `national/adaptation/${id}/stage`,
  archive: (id: number) => `national/adaptation/${id}/archive`,
} as const;
