import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Like, Repository } from "typeorm";
import { SectoralScope } from "@undp/serial-number-gen";
import { Company } from "@app/shared/entities/company.entity";
import { Programme } from "@app/shared/entities/programme.entity";
import { AdaptationProjectEntity } from "@app/shared/entities/adaptation.project.entity";
import { CommunityProgramEntity } from "@app/shared/entities/community.program.entity";
import { MethodologyEntity } from "@app/shared/entities/methodology.entity";
import { ExpertEntity } from "@app/shared/entities/expert.entity";
import { GuidanceDocumentEntity } from "@app/shared/entities/guidance.document.entity";
import { EmissionCeilingEntity } from "@app/shared/entities/emission.ceiling.entity";
import { EmissionParticipantEntity } from "@app/shared/entities/emission.participant.entity";
import { EmissionTradingEntity } from "@app/shared/entities/emission.trading.entity";
import { NdcTargetEntity } from "@app/shared/entities/ndc.target.entity";
import { RecognizedMitigationEntity } from "@app/shared/entities/recognized.mitigation.entity";
import { CompanyRole } from "@app/shared/enum/company.role.enum";
import { CompanyState } from "@app/shared/enum/company.state.enum";
import { ProponentCategory } from "@app/shared/enum/proponent.category.enum";
import { Sector } from "@app/shared/enum/sector.enum";
import { ProgrammeStage } from "@app/shared/enum/programme-status.enum";
import { AdaptationSector } from "@app/shared/enum/adaptation.sector.enum";
import { AdaptationStage } from "@app/shared/enum/adaptation.stage.enum";
import { CommunityProgramCategory } from "@app/shared/enum/community.program.category.enum";
import { CommunityProgramStatus } from "@app/shared/enum/community.program.status.enum";
import { MethodologyStatus } from "@app/shared/enum/methodology.status.enum";
import { ExpertStatus } from "@app/shared/enum/expert.status.enum";
import { NdcSector } from "@app/shared/enum/ndc.sector.enum";
import { RecognizedMitigationStatus } from "@app/shared/enum/recognized.mitigation.status.enum";
import { DEMO_MINIMUMS, DEMO_SCENARIO, DemoSeedLoadResult, DemoSeedScenario } from "./scenario";

const PREFIX = "CHAMPA-DEMO-";
const TITLE_PREFIX = "[Synthetic demo] ";
const PROVINCES = ["Vientiane Capital", "Luang Prabang", "Savannakhet", "Champasak", "Attapeu", "Bolikhamxay", "Khammouane", "Houaphanh", "Xayaboury", "Xiangkhouang"];
const SECTORS = [Sector.Energy, Sector.Agriculture, Sector.Forestry, Sector.Waste, Sector.Transport, Sector.Manufacturing];
const SCOPES = [SectoralScope.EnergyIndustry, SectoralScope.Agriculture, SectoralScope.AfforestationAndReforestation, SectoralScope.WasteHandlingDisposal, SectoralScope.Transport, SectoralScope.ManufacturingIndustries];
const ADAPTATION_SECTORS = Object.values(AdaptationSector);

export function nonCertificatePlanIsComplete(counts: Record<string, number>): boolean {
  return counts.organisations >= DEMO_MINIMUMS.organisations && counts.programmes >= DEMO_MINIMUMS.programmes && counts.adaptation >= DEMO_MINIMUMS.adaptationActions && counts.community >= DEMO_MINIMUMS.communityActions && counts.methodologies >= DEMO_MINIMUMS.methodologies && counts.experts >= DEMO_MINIMUMS.experts && counts.documents >= DEMO_MINIMUMS.documents && counts.participants >= DEMO_MINIMUMS.ceilingParticipants && counts.trades >= DEMO_MINIMUMS.marketTrades && counts.ndc >= 30;
}

/** Owns only rows carrying the deterministic CHAMPA-DEMO identifiers. */
@Injectable()
export class NonCertificatePublicDemoLoader {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Programme) private readonly programmes: Repository<Programme>,
    @InjectRepository(AdaptationProjectEntity) private readonly adaptations: Repository<AdaptationProjectEntity>,
    @InjectRepository(CommunityProgramEntity) private readonly communities: Repository<CommunityProgramEntity>,
    @InjectRepository(MethodologyEntity) private readonly methodologies: Repository<MethodologyEntity>,
    @InjectRepository(ExpertEntity) private readonly experts: Repository<ExpertEntity>,
    @InjectRepository(GuidanceDocumentEntity) private readonly documents: Repository<GuidanceDocumentEntity>,
    @InjectRepository(EmissionCeilingEntity) private readonly ceilings: Repository<EmissionCeilingEntity>,
    @InjectRepository(EmissionParticipantEntity) private readonly participants: Repository<EmissionParticipantEntity>,
    @InjectRepository(EmissionTradingEntity) private readonly trades: Repository<EmissionTradingEntity>,
    @InjectRepository(NdcTargetEntity) private readonly ndc: Repository<NdcTargetEntity>,
    @InjectRepository(RecognizedMitigationEntity) private readonly mitigation: Repository<RecognizedMitigationEntity>,
  ) {}

  async load(scenario: DemoSeedScenario): Promise<DemoSeedLoadResult> {
    const counts = await this.counts();
    if (nonCertificatePlanIsComplete(counts)) return { status: "unchanged", hash: scenario.hash };
    await this.removeOnlyScenarioRows();
    const now = Date.parse(DEMO_SCENARIO.asOf);
    const companies = Array.from({ length: 180 }, (_, index) => {
      const ordinal = index + 1;
      const isAgency = ordinal <= 30;
      const isVerifier = ordinal > 150 && ordinal <= 170;
      return this.companies.create({ companyId: 900000 + ordinal, taxId: `${PREFIX}ORG-${String(ordinal).padStart(3, "0")}`, paymentId: `${PREFIX}PAY-${ordinal}`, name: `${TITLE_PREFIX}${isAgency ? "Public climate agency" : isVerifier ? "Validation agency" : "Climate programme organisation"} ${ordinal}`, email: `demo-org-${ordinal}@invalid.example`, address: `${PROVINCES[index % PROVINCES.length]}, synthetic demo`, country: "LA", companyRole: isAgency ? CompanyRole.MINISTRY : isVerifier ? CompanyRole.INDEPENDENT_CERTIFIER : CompanyRole.PROJECT_DEVELOPER, state: CompanyState.ACTIVE, proponentCategory: isAgency ? ProponentCategory.GOVERNMENT : ProponentCategory.PRIVATE_SECTOR, createdTime: now - (ordinal % 2100) * 86400000, provinces: [PROVINCES[index % PROVINCES.length]], sectoralScope: [SCOPES[index % SCOPES.length]] });
    });
    await this.companies.save(companies);
    const developers = companies.slice(30);
    await this.programmes.save(Array.from({ length: 240 }, (_, index) => {
      const ordinal = index + 1, developer = developers[index % developers.length], sector = SECTORS[index % SECTORS.length], start = Math.floor((Date.parse(`${2021 + (index % 6)}-01-15T00:00:00Z`)) / 1000), credit = 10000 + (index % 20) * 1750;
      return { programmeId: `champa-demo-programme-${String(ordinal).padStart(4, "0")}`, externalId: `${PREFIX}PROGRAMME-${String(ordinal).padStart(4, "0")}`, title: `${TITLE_PREFIX}${sector} transition programme ${ordinal}`, serialNo: `${PREFIX}SERIAL-${ordinal}`, sector, sectoralScope: SCOPES[index % SCOPES.length], countryCodeA2: "LA", currentStage: [ProgrammeStage.AUTHORISED, ProgrammeStage.APPROVED, ProgrammeStage.AWAITING_AUTHORIZATION, ProgrammeStage.REJECTED][index % 4], startTime: start, endTime: start + 315360000, creditEst: credit, creditIssued: index % 4 < 2 ? credit : 0, creditBalance: index % 4 < 2 ? Math.floor(credit * .68) : 0, creditRetired: [Math.floor(credit * .12)], creditCancelled: [Math.floor(credit * .04)], creditAssignedToExchange: [Math.floor(credit * .08)], proponentTaxVatId: [developer.taxId], companyId: [developer.companyId], article6trade: false, creditUnit: "tCO2e", programmeProperties: { geographicalLocation: [PROVINCES[index % PROVINCES.length]], greenHouseGasses: ["CO2"], estimatedProgrammeCostUSD: 200000 + index * 12000 }, txTime: start, createdTime: start, createdAt: new Date(start * 1000), updatedAt: new Date(start * 1000) } as unknown as Programme;
    }));
    await this.adaptations.save(Array.from({ length: 120 }, (_, index) => this.adaptations.create({ adaptationId: `${PREFIX}ADAPT-${index + 1}`, title: `${TITLE_PREFIX}resilience action ${index + 1}`, description: "Synthetic 2021–2026 public demonstration record; not an official programme.", sector: ADAPTATION_SECTORS[index % ADAPTATION_SECTORS.length], region: PROVINCES[index % PROVINCES.length], companyId: developers[index % developers.length].companyId, currentStage: [AdaptationStage.APPROVED, AdaptationStage.UNDER_REVIEW, AdaptationStage.SUBMITTED][index % 3], createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    await this.communities.save(Array.from({ length: 120 }, (_, index) => this.communities.create({ programId: `${PREFIX}COMMUNITY-${index + 1}`, name: `${TITLE_PREFIX}community climate action ${index + 1}`, region: PROVINCES[index % PROVINCES.length], category: [CommunityProgramCategory.ADAPTATION, CommunityProgramCategory.MITIGATION, CommunityProgramCategory.BOTH][index % 3], description: "Synthetic community demonstration record; not an official programme.", participantCount: 80 + (index % 40) * 25, startYear: 2021 + (index % 6), status: [CommunityProgramStatus.ACTIVE, CommunityProgramStatus.COMPLETED, CommunityProgramStatus.PLANNED][index % 3], createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    await this.methodologies.save(Array.from({ length: 24 }, (_, index) => this.methodologies.create({ methodologyNumber: `${PREFIX}METH-${String(index + 1).padStart(3, "0")}`, name: `${TITLE_PREFIX}${SECTORS[index % SECTORS.length]} accounting method ${index + 1}`, source: "Synthetic demonstration catalogue", category: SECTORS[index % SECTORS.length], status: index % 7 ? MethodologyStatus.ACTIVE : MethodologyStatus.INACTIVE, description: "Synthetic demonstration methodology, not an approved method.", createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    await this.experts.save(Array.from({ length: 75 }, (_, index) => this.experts.create({ name: `${TITLE_PREFIX}technical expert ${index + 1}`, affiliation: "Synthetic demonstration institution", expertise: `${SECTORS[index % SECTORS.length]} MRV and climate planning`, certification: "Synthetic demo profile", yearsOfExperience: 4 + (index % 24), province: PROVINCES[index % PROVINCES.length], status: ExpertStatus.ACTIVE, createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    await this.documents.save(Array.from({ length: 40 }, (_, index) => this.documents.create({ title: `${TITLE_PREFIX}guidance document ${index + 1}`, description: "Synthetic demo reference only; not official guidance.", category: SECTORS[index % SECTORS.length], documentUrl: `data:text/plain;base64,U3ludGhldGljIGRlbW8gZG9jdW1lbnQu`, createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    await this.ceilings.save(Array.from({ length: 220 }, (_, index) => this.ceilings.create({ companyId: developers[index % developers.length].companyId, year: 2021 + (index % 6), units: 40000 + (index % 60) * 1000, seriesName: "Synthetic demonstration ceiling series", sector: "Synthetic demo", unit: "tCO2e", venueStatus: "synthetic_demo", availability: "available", createdAt: now - index * 86400000 })));
    await this.participants.save(Array.from({ length: 220 }, (_, index) => this.participants.create({ companyId: developers[index % developers.length].companyId, facilityName: `${TITLE_PREFIX}facility ${index + 1}`, capacityDescription: `${10 + (index % 90)} MW (synthetic)`, year: 2021 + (index % 6), seriesName: "Synthetic demonstration ceiling series", sector: "Synthetic demo", participantStatus: "active_demo", createdAt: now - index * 86400000 })));
    await this.trades.save(Array.from({ length: 180 }, (_, index) => this.trades.create({ sellerCompanyId: developers[index % developers.length].companyId, buyerCompanyId: developers[(index + 1) % developers.length].companyId, units: 500 + (index % 60) * 100, valueLAK: 15000000 + index * 250000, seriesName: "Synthetic demonstration market", venueStatus: "synthetic_demo", settlementStatus: "not_applicable", idempotencyKey: `${PREFIX}TRADE-${index + 1}`, tradeDate: Math.floor(Date.parse(`${2021 + (index % 6)}-06-15T00:00:00Z`) / 1000), createdAt: now - index * 86400000 })));
    await this.ndc.save(Object.values(NdcSector).flatMap((sector, sectorIndex) => Array.from({ length: 6 }, (_, index) => this.ndc.create({ year: 2021 + index, sector, baselineEmissions: 80000 + sectorIndex * 12000, targetEmissions2030: 50000 + sectorIndex * 8500, achievedEmissions: 76000 + sectorIndex * 11000 - index * 1800, claimedEmissions: 75000 + sectorIndex * 11000 - index * 1900, notes: "Synthetic demonstration NDC series; not official statistics.", createdAt: now - index * 86400000, updatedAt: now - index * 86400000 }))));
    await this.mitigation.save(Array.from({ length: 120 }, (_, index) => this.mitigation.create({ referenceId: `${PREFIX}MITIGATION-${index + 1}`, title: `${TITLE_PREFIX}recognized mitigation action ${index + 1}`, description: "Synthetic demonstration action; not official recognition.", proponentName: developers[index % developers.length].name, proponentType: CompanyRole.PROJECT_DEVELOPER, proponentCompanyId: developers[index % developers.length].companyId, sector: SECTORS[index % SECTORS.length], region: PROVINCES[index % PROVINCES.length], estimatedReductionTco2e: 500 + index * 40, status: [RecognizedMitigationStatus.RECOGNIZED, RecognizedMitigationStatus.UNDER_REVIEW, RecognizedMitigationStatus.SUBMITTED][index % 3], createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    return { status: "loaded", hash: scenario.hash };
  }

  private async removeOnlyScenarioRows(): Promise<void> {
    await Promise.all([
      this.programmes.delete({ externalId: Like(`${PREFIX}PROGRAMME-%`) }), this.adaptations.delete({ adaptationId: Like(`${PREFIX}ADAPT-%`) }), this.communities.delete({ programId: Like(`${PREFIX}COMMUNITY-%`) }), this.methodologies.delete({ methodologyNumber: Like(`${PREFIX}METH-%`) }), this.experts.delete({ name: Like(`${TITLE_PREFIX}%`) }), this.documents.delete({ title: Like(`${TITLE_PREFIX}%`) }), this.trades.delete({ idempotencyKey: Like(`${PREFIX}TRADE-%`) }), this.mitigation.delete({ referenceId: Like(`${PREFIX}MITIGATION-%`) }), this.ndc.delete({ notes: "Synthetic demonstration NDC series; not official statistics." }),
    ]);
    const demoCompanies = await this.companies.find({ where: { taxId: Like(`${PREFIX}ORG-%`) } });
    const ids = demoCompanies.map(({ companyId }) => companyId);
    if (ids.length) { await this.ceilings.delete({ companyId: In(ids) }); await this.participants.delete({ companyId: In(ids) }); await this.companies.delete({ companyId: In(ids) }); }
  }

  private async counts(): Promise<Record<string, number>> {
    const [organisations, programmes, adaptation, community, methodologies, experts, documents, participants, trades, ndc] = await Promise.all([
      this.companies.countBy({ taxId: Like(`${PREFIX}ORG-%`) }), this.programmes.countBy({ externalId: Like(`${PREFIX}PROGRAMME-%`) }), this.adaptations.countBy({ adaptationId: Like(`${PREFIX}ADAPT-%`) }), this.communities.countBy({ programId: Like(`${PREFIX}COMMUNITY-%`) }), this.methodologies.countBy({ methodologyNumber: Like(`${PREFIX}METH-%`) }), this.experts.countBy({ name: Like(`${TITLE_PREFIX}%`) }), this.documents.countBy({ title: Like(`${TITLE_PREFIX}%`) }), this.participants.countBy({ facilityName: Like(`${TITLE_PREFIX}%`) }), this.trades.countBy({ idempotencyKey: Like(`${PREFIX}TRADE-%`) }), this.ndc.countBy({ notes: "Synthetic demonstration NDC series; not official statistics." }),
    ]);
    return { organisations, programmes, adaptation, community, methodologies, experts, documents, participants, trades, ndc };
  }
}
