import { ConnectionProps } from "../../Definitions/Definitions/connectionContext.definitions";

const BASE_PATH = "national/expert";

export type ExpertStatus = "Active" | "Inactive";

export interface ExpertRecord {
  id: number;
  name: string;
  affiliation: string;
  expertise: string;
  certification?: string | null;
  yearsOfExperience?: number | null;
  province: string;
  status: ExpertStatus;
  archivedAt?: number | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  updatedAt?: number | null;
}

export interface ExpertDraft {
  name: string;
  affiliation: string;
  expertise: string;
  certification?: string;
  yearsOfExperience?: number;
  province: string;
}

export interface ExpertListResponse {
  data: ExpertRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const expertManagementApi = {
  list: (
    connection: ConnectionProps,
    search: string,
    status?: ExpertStatus
  ) =>
    connection.get(
      `${BASE_PATH}/admin?search=${encodeURIComponent(search)}${
        status ? `&status=${encodeURIComponent(status)}` : ""
      }`
    ) as Promise<{ data: ExpertRecord[] }>,
  detail: (connection: ConnectionProps, id: number) =>
    connection.get(`${BASE_PATH}/admin/${id}`) as Promise<{
      data: ExpertRecord;
    }>,
  create: (connection: ConnectionProps, payload: ExpertDraft) =>
    connection.post(BASE_PATH, payload),
  update: (connection: ConnectionProps, id: number, payload: ExpertDraft) =>
    connection.put(`${BASE_PATH}/${id}`, payload),
  setStatus: (
    connection: ConnectionProps,
    id: number,
    status: ExpertStatus
  ) => connection.patch(`${BASE_PATH}/${id}/status`, { status }),
  archive: (connection: ConnectionProps, id: number) =>
    connection.post(`${BASE_PATH}/${id}/archive`),
};
