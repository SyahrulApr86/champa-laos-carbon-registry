export type CertificateLifecycleEvent =
  | "ISSUED"
  | "TRANSFERRED"
  | "RETIRED"
  | "CANCELLED"
  | "ASSIGNED_TO_EXCHANGE"
  | "RELEASED"
  | "REVERSED";

export interface CertificateLotFormValues {
  certificateLotId?: string;
  programmeId: string;
  certificateId: string;
  registryScheme?: string;
  registryNumber?: string;
  serialNumber?: string;
  vintageStart?: string;
  vintageEnd?: string;
  issuedQuantity: number;
  unit?: string;
}
export interface ManagementLot {
  certificate_lot_id: string;
  programme_id: string;
  certificate_id: string;
  registry_scheme: string;
  registry_number: string | null;
  serial_number: string | null;
  vintage_start: string | null;
  vintage_end: string | null;
  issued_quantity: number;
  unit: string;
  issued_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
}

export interface CertificateLotSummary {
  certificate_id: string;
  balances: Record<string, number>;
  event_totals: Record<string, number>;
  lot: ManagementLot;
  event_count: number;
  editable: boolean;
}

export interface CertificateLotListResponse {
  data: CertificateLotSummary[];
  meta?: {
    pagination?: {
      page: number;
      page_size: number;
      total_items: number;
      total_pages: number;
    };
  };
}

export interface CertificatePortion {
  certificate_portion_id: string;
  owner_company_id: string | null;
  state: string;
  quantity: number;
}

export interface CertificateEvent {
  event_id: string;
  idempotency_key: string;
  event_type: CertificateLifecycleEvent;
  quantity: number;
  source_portion_id: string | null;
  parent_event_id: string | null;
  to_owner_company_id: string | null;
  actor_reference: string | null;
  reason: string | null;
}

export interface CertificateLotDetail {
  lot: ManagementLot;
  certificate: CertificateLotSummary;
  portions: CertificatePortion[];
  events: CertificateEvent[];
  editable: boolean;
}

export interface CertificateLotDetailResponse {
  data: CertificateLotDetail;
}
