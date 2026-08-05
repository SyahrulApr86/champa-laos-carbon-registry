/**
 * W5 schema handoff only.
 *
 * These interfaces are intentionally not TypeORM entities and do not prescribe
 * migration names or column ownership. W2/W1 should use them when freezing
 * the final domain schema and deterministic seed fixtures.
 */

export type DomainAvailability =
  | "available"
  | "not_available"
  | "not_applicable"
  | "withheld"
  | "not_configured";

export interface PublicOptionalField<T> {
  value: T | null;
  availability: DomainAvailability;
  source?: string | null;
  as_of?: string | null;
}

export interface ActionPeriodProposal {
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  duration_label: string | null;
  availability: DomainAvailability;
}

export interface CommunityActionSchemaProposal {
  stable_id: string;
  name: string;
  category: string;
  status: string;
  period: ActionPeriodProposal;
  goals: PublicOptionalField<string>;
  responsible_organisation_id: PublicOptionalField<string>;
  region_id: PublicOptionalField<string>;
  location_label: PublicOptionalField<string>;
  participant_count: PublicOptionalField<number>;
  vulnerability: PublicOptionalField<string>;
  documents: PublicOptionalField<Array<{ document_id: string; title: string; url: string | null }>>;
}

export interface AdaptationActionSchemaProposal {
  stable_id: string;
  title: string;
  category: string;
  status: string;
  period: ActionPeriodProposal;
  goal: PublicOptionalField<string>;
  responsible_organisation_id: PublicOptionalField<string>;
  region_id: PublicOptionalField<string>;
  location_label: PublicOptionalField<string>;
  vulnerability: PublicOptionalField<string>;
  documents: PublicOptionalField<Array<{ document_id: string; title: string; url: string | null }>>;
}

export interface ResourceRecordSchemaProposal {
  stable_id: string;
  resource_kind: "finance" | "technology_transfer" | "capacity_building";
  title: string;
  sector: string;
  channel_or_type: string;
  recipient_organisation: PublicOptionalField<string>;
  implementing_organisation: PublicOptionalField<string>;
  period: ActionPeriodProposal;
  amount: PublicOptionalField<number>;
  currency: string | null;
  financial_instrument: PublicOptionalField<string>;
  status: string;
  impact_or_result: PublicOptionalField<string>;
  additional_information: PublicOptionalField<string>;
}

export const W5_SCHEMA_HANDOFF = {
  community: ["period", "goals", "responsible_organisation_id", "region_id", "vulnerability", "documents", "participant_count"],
  adaptation: ["period", "goal", "responsible_organisation_id", "region_id", "vulnerability", "documents"],
  resources: ["resource_kind", "period", "amount", "currency", "channel_or_type", "status", "provenance"],
  rules: [
    "Do not make null amounts or unavailable dates into zero values.",
    "Do not combine LAK and another currency without explicit source/rate metadata.",
    "Duration is derived from validated ISO dates and stored/displayed in days plus a human label.",
    "Every seeded record carries demo provenance and the public disclosure contract.",
  ],
} as const;
