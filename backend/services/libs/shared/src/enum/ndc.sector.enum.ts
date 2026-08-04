// NDC (Nationally Determined Contribution) sector taxonomy, matching
// Indonesia's SRN registry's 5 real sectors used to break down national
// emission baseline/target/achievement figures on the public NDC
// Achievement page (SRN also exposes an "All" aggregate view computed
// across these 5, never stored as its own row).
export enum NdcSector {
  ENERGY = "Energy",
  IPPU = "Industrial Processes and Product Use",
  AGRICULTURE = "Agriculture",
  FORESTRY = "Forestry",
  WASTE = "Waste",
}
