import { ConnectionProps } from "../../Definitions/Definitions/connectionContext.definitions";

const BASE_PATH = "national/guidanceDocument";

export type GuidanceDocumentStatus = "Draft" | "Published" | "Archived";

export interface GuidanceDocumentRecord {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  documentUrl: string;
  documentGroupId?: number | null;
  version: number;
  status: GuidanceDocumentStatus;
  createdAt?: number;
  updatedAt?: number | null;
  publishedAt?: number | null;
  archivedAt?: number | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface GuidanceDocumentDraft {
  title: string;
  description?: string;
  category?: string;
  documentUrl: string;
}

export interface GuidanceDocumentListResponse {
  data: GuidanceDocumentRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const guidanceDocumentManagementApi = {
  list: (
    connection: ConnectionProps,
    search: string,
    status?: GuidanceDocumentStatus
  ) =>
    connection.get(
      `${BASE_PATH}/admin?search=${encodeURIComponent(search)}${
        status ? `&status=${encodeURIComponent(status)}` : ""
      }`
    ) as Promise<{ data: GuidanceDocumentListResponse }>,
  detail: (connection: ConnectionProps, id: number) =>
    connection.get(`${BASE_PATH}/admin/${id}`) as Promise<{
      data: { document: GuidanceDocumentRecord; versions: GuidanceDocumentRecord[] };
    }>,
  create: (connection: ConnectionProps, payload: GuidanceDocumentDraft) =>
    connection.post(BASE_PATH, payload),
  update: (
    connection: ConnectionProps,
    id: number,
    payload: Partial<GuidanceDocumentDraft>
  ) => connection.put(`${BASE_PATH}/${id}`, payload),
  publish: (connection: ConnectionProps, id: number) =>
    connection.post(`${BASE_PATH}/${id}/publish`),
  archive: (connection: ConnectionProps, id: number) =>
    connection.post(`${BASE_PATH}/${id}/archive`),
};
