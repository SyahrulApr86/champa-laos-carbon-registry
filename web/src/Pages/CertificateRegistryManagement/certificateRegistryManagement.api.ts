import { ConnectionProps } from "../../Definitions/Definitions/connectionContext.definitions";
import { CERTIFICATE_REGISTRY_MANAGEMENT_API } from "./certificateRegistryManagement.constants";
import {
  CertificateLifecycleEvent,
  CertificateLotDetail,
  CertificateLotSummary,
  CertificateLotFormValues,
} from "./certificateRegistryManagement.types";

export const listCertificateLots = (
  connection: ConnectionProps,
  query: { q?: string; includeArchived?: boolean } = {},
) => {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.includeArchived) params.set("includeArchived", "true");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return connection.get<CertificateLotSummary[]>(`${CERTIFICATE_REGISTRY_MANAGEMENT_API.lots}${suffix}`);
};

export const getCertificateLot = (connection: ConnectionProps, certificateLotId: string) =>
  connection.get<CertificateLotDetail>(CERTIFICATE_REGISTRY_MANAGEMENT_API.lot(certificateLotId));

export const createCertificateLot = (connection: ConnectionProps, values: CertificateLotFormValues) =>
  connection.post(CERTIFICATE_REGISTRY_MANAGEMENT_API.createLot, values);

export const updateCertificateLot = (
  connection: ConnectionProps,
  certificateLotId: string,
  values: Partial<CertificateLotFormValues>,
) => connection.patch(CERTIFICATE_REGISTRY_MANAGEMENT_API.updateLot(certificateLotId), values);

export const archiveCertificateLot = (
  connection: ConnectionProps,
  certificateLotId: string,
  reason: string,
) => connection.post(CERTIFICATE_REGISTRY_MANAGEMENT_API.archiveLot(certificateLotId), { reason });

export const recordCertificateLifecycle = (
  connection: ConnectionProps,
  certificateLotId: string,
  eventType: CertificateLifecycleEvent,
  command: Record<string, unknown>,
) => connection.post(CERTIFICATE_REGISTRY_MANAGEMENT_API.lifecycle(certificateLotId, eventType), command);
