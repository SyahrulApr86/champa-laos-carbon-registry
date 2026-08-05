export const CERTIFICATE_REGISTRY_MANAGEMENT_API = {
  lots: "national/programme/certificate-registry/management",
  lot: (certificateLotId: string) =>
    `national/programme/certificate-registry/management/${encodeURIComponent(certificateLotId)}`,
  createLot: "national/programme/certificate-registry/management/lots",
  updateLot: (certificateLotId: string) =>
    `national/programme/certificate-registry/management/lots/${encodeURIComponent(certificateLotId)}`,
  archiveLot: (certificateLotId: string) =>
    `national/programme/certificate-registry/management/lots/${encodeURIComponent(certificateLotId)}/archive`,
  event: "national/programme/certificate-registry/management/events",
  lifecycle: (certificateLotId: string, eventType: string) =>
    `national/programme/certificate-registry/management/lots/${encodeURIComponent(certificateLotId)}/${eventType.toLowerCase()}`,
} as const;
