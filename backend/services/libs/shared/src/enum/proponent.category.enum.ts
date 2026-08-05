// Institutional classification of a Programme Developer/proponent
// organisation - orthogonal to CompanyRole (which captures the
// *functional* registry role: Project Developer/Certifier/Ministry/etc).
// Categories follow the institutional-type taxonomy used across CDM
// project participant disclosures, Article 6.4 PACM participant
// categorisation and CORSIA/CDAT-style registries (government / private
// sector / civil society / academia / community-based / international
// organisation), adapted to what Champa can honestly classify proponents
// as without a Lao-specific legal-entity-type dataset.
export enum ProponentCategory {
  GOVERNMENT = "Government",
  PRIVATE_SECTOR = "Private Sector",
  NGO_CIVIL_SOCIETY = "NGO/Civil Society",
  ACADEMIA_RESEARCH = "Academia/Research",
  COMMUNITY_BASED_ORGANISATION = "Community-Based Organisation",
  INTERNATIONAL_ORGANISATION = "International Organisation",
}
