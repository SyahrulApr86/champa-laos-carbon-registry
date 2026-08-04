// Simple, honest 4-state workflow for recognized mitigation actions - a
// smaller-scale/community-level registry, distinct from the full
// Programme certification track (which has its own multi-stage
// validation/verification workflow).
export enum RecognizedMitigationStatus {
  SUBMITTED = "Submitted",
  UNDER_REVIEW = "UnderReview",
  RECOGNIZED = "Recognized",
  REJECTED = "Rejected",
}
