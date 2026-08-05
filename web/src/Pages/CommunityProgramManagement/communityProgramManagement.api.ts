export const COMMUNITY_PROGRAM_MANAGEMENT_API = {
  list: (includeArchived = false) =>
    `national/communityProgram/management${includeArchived ? "?includeArchived=true" : ""}`,
  detail: (id: number) => `national/communityProgram/management/${id}`,
  update: (id: number) => `national/communityProgram/${id}`,
  archive: (id: number) => `national/communityProgram/${id}/archive`,
} as const;
