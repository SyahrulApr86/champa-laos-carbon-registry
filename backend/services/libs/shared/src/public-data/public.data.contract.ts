export type PublicDatasetKind =
  | "demo_synthetic"
  | "authoritative"
  | "mixed_explicit";

export type PublicAvailability =
  | "available"
  | "not_available"
  | "not_applicable"
  | "withheld"
  | "not_configured";

export type PublicQualityStatus =
  | "observed"
  | "derived"
  | "estimated_demo"
  | "incomplete"
  | "not_available";

export interface PublicPeriod {
  start: string | null;
  end: string | null;
  availability: PublicAvailability;
}

export interface PublicPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface PublicDataMeta {
  dataset_kind: PublicDatasetKind;
  scenario: string;
  as_of: string;
  period: PublicPeriod;
  source: {
    type: "synthetic_demo" | "official_register" | "approved_import" | "derived";
    label: string;
  };
  methodology_version: string | null;
  unit: string | null;
  scale: number | string | null;
  currency: string | null;
  timezone: "UTC";
  filters: Record<string, string | number | null>;
  pagination: PublicPagination;
  availability: PublicAvailability;
  quality_status: PublicQualityStatus;
  disclosure: string;
  exclusions?: Record<string, number>;
}

export interface PublicListResponse<T> {
  data: T[];
  meta: PublicDataMeta;
}

export interface PublicDetailResponse<T> {
  data: T | null;
  meta: PublicDataMeta;
}

export const SYNTHETIC_DISCLOSURE =
  "Synthetic demonstration data — not official Lao PDR statistics, legal authorisation, market activity, or certificate records. Scenario: Champa registry demonstration.";

export const createPublicMeta = (
  filters: Record<string, string | number | null>,
  options: {
    unit?: string | null;
    period?: PublicPeriod;
    pagination?: Partial<PublicPagination>;
    availability?: PublicAvailability;
    quality_status?: PublicQualityStatus;
    exclusions?: Record<string, number>;
  } = {}
): PublicDataMeta => {
  const page = options.pagination?.page ?? 1;
  const pageSize = options.pagination?.page_size ?? 10;
  const totalItems = options.pagination?.total_items ?? 0;

  return {
    dataset_kind: "demo_synthetic",
    scenario: "Champa registry demonstration",
    as_of: "2026-08-05T00:00:00Z",
    period: options.period ?? {
      start: "2021-01-01",
      end: "2026-12-31",
      availability: "available",
    },
    source: { type: "synthetic_demo", label: "Champa W1 seed v1" },
    methodology_version: "champa-parity-demo-v1",
    unit: options.unit ?? "records",
    scale: 1,
    currency: null,
    timezone: "UTC",
    filters,
    pagination: {
      page,
      page_size: pageSize,
      total_items: totalItems,
      total_pages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
    },
    availability: options.availability ?? "available",
    quality_status: options.quality_status ?? "estimated_demo",
    disclosure: SYNTHETIC_DISCLOSURE,
    ...(options.exclusions ? { exclusions: options.exclusions } : {}),
  };
};

export const calculateCalendarDuration = (
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): { days: number; years: number; label: string } | null => {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate.getTime() < startDate.getTime()
  ) {
    return null;
  }

  const days = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  const years = Math.floor(days / 365);
  const remainingDays = days - years * 365;
  const label = years
    ? `${years} year${years === 1 ? "" : "s"}${remainingDays ? ` ${remainingDays} days` : ""}`
    : `${days} day${days === 1 ? "" : "s"}`;

  return { days, years, label };
};
