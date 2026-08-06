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
import { ClimateFinanceEntity } from "@app/shared/entities/climate.finance.entity";
import { TechnologyTransferEntity } from "@app/shared/entities/technology.transfer.entity";
import { CapacityBuildingEntity } from "@app/shared/entities/capacity.building.entity";
import { EmissionCeilingEntity } from "@app/shared/entities/emission.ceiling.entity";
import { EmissionParticipantEntity } from "@app/shared/entities/emission.participant.entity";
import { EmissionTradingEntity } from "@app/shared/entities/emission.trading.entity";
import { NdcTargetEntity } from "@app/shared/entities/ndc.target.entity";
import { RecognizedMitigationEntity } from "@app/shared/entities/recognized.mitigation.entity";
import { ReddPlusEntity } from "@app/shared/entities/redd.plus.entity";
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
import { ReddPlusStatus } from "@app/shared/enum/redd.plus.status.enum";
import { FinanceChannel } from "@app/shared/enum/finance.channel.enum";
import { FinancialInstrument } from "@app/shared/enum/finance.instrument.enum";
import { FinanceStatus } from "@app/shared/enum/finance.status.enum";
import { ClimateActionType } from "@app/shared/enum/climate.action.type.enum";
import { SupportStatus } from "@app/shared/enum/support.status.enum";
import { DEMO_MINIMUMS, DEMO_SCENARIO, DemoSeedLoadResult, DemoSeedScenario } from "./scenario";

const PREFIX = "CHAMPA-DEMO-";
const TITLE_PREFIX = "[Synthetic demo] ";
const PROVINCES = ["Vientiane Capital", "Luang Prabang", "Savannakhet", "Champasak", "Attapeu", "Bolikhamxay", "Khammouane", "Houaphanh", "Xayaboury", "Xiangkhouang"];
const REDD_PLUS_FIXTURES: Array<[string, number, number, string]> = [
  ["Attapeu", 72000, 14400, "Department of Forestry (MAE)"],
  ["Bokeo", 68000, 13600, "National Protected Area"],
  ["Bolikhamxay", 95000, 18500, "National Protected Area"],
  ["Champasak", 38000, 9000, "Department of Forestry (MAE)"],
  ["Houaphanh", 210000, 42000, "National Protected Area"],
  ["Khammouane", 56000, 11200, "Department of Forestry (MAE)"],
  ["Luang Namtha", 84000, 16800, "Provincial Forestry Office"],
  ["Luang Prabang", 126000, 25200, "National Protected Area"],
  ["Oudomxay", 92000, 18400, "Provincial Forestry Office"],
  ["Phongsaly", 110000, 22000, "National Protected Area"],
  ["Salavan", 74000, 14800, "Department of Forestry (MAE)"],
  ["Savannakhet", 64000, 12800, "Provincial Forestry Office"],
  ["Sekong", 48000, 9600, "Department of Forestry (MAE)"],
  ["Vientiane Capital", 45000, 9000, "Ministry of Agriculture and Environment"],
  ["Vientiane Province", 102000, 20400, "Provincial Forestry Office"],
  ["Xaisomboun", 58000, 11600, "National Protected Area"],
  ["Xayaboury", 88000, 21000, "Department of Forestry (MAE)"],
  ["Xiangkhouang", 116000, 23200, "Provincial Forestry Office"],
];
const REDD_LEGACY_TITLES = [
  "Nam Kading Protected Area REDD+ Pilot",
  "Nam Et-Phou Louey Forest Carbon Pilot",
  "Dong Khanthung Community Forest REDD+",
  "Nam Phui Watershed Deforestation Reduction",
];
const LEGACY_RESOURCE_TITLES = [
  "Green Climate Fund Readiness Support",
  "Nordic Climate Facility Renewable Energy Grant",
  "World Bank Forest Landscape Programme Loan",
  "JICA Climate-Resilient Agriculture Grant",
  "ADB Municipal Waste Management Concessional Loan",
  "EU Climate Adaptation Technical Assistance",
  "Floating Solar PV Pilot Technology Transfer",
  "Biogas Digester Manufacturing Know-How Transfer",
  "Smart Meter and Grid Monitoring Technology",
  "Improved Cookstove Local Manufacturing Transfer",
  "National GHG Inventory Training Programme",
  "MRV System Training for Sub-National Officers",
  "Carbon Project Development Workshop Series",
  "Climate Finance Proposal Writing Bootcamp",
];
const SECTORS = [Sector.Energy, Sector.Agriculture, Sector.Forestry, Sector.Waste, Sector.Transport, Sector.Manufacturing];
const SCOPES = [SectoralScope.EnergyIndustry, SectoralScope.Agriculture, SectoralScope.AfforestationAndReforestation, SectoralScope.WasteHandlingDisposal, SectoralScope.Transport, SectoralScope.ManufacturingIndustries];
const ADAPTATION_SECTORS = Object.values(AdaptationSector);

export function nonCertificatePlanIsComplete(counts: Record<string, number>): boolean {
  return counts.organisations >= DEMO_MINIMUMS.organisations && counts.programmes >= DEMO_MINIMUMS.programmes && counts.adaptation >= DEMO_MINIMUMS.adaptationActions && counts.community >= DEMO_MINIMUMS.communityActions && counts.reddPlus >= DEMO_MINIMUMS.reddPlus && counts.methodologies >= DEMO_MINIMUMS.methodologies && counts.experts >= DEMO_MINIMUMS.experts && counts.documents >= DEMO_MINIMUMS.documents && counts.participants >= DEMO_MINIMUMS.ceilingParticipants && counts.trades >= DEMO_MINIMUMS.marketTrades && counts.ndc >= 30;
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
    @InjectRepository(ClimateFinanceEntity) private readonly climateFinance: Repository<ClimateFinanceEntity>,
    @InjectRepository(TechnologyTransferEntity) private readonly technologyTransfers: Repository<TechnologyTransferEntity>,
    @InjectRepository(CapacityBuildingEntity) private readonly capacityBuilding: Repository<CapacityBuildingEntity>,
    @InjectRepository(EmissionCeilingEntity) private readonly ceilings: Repository<EmissionCeilingEntity>,
    @InjectRepository(EmissionParticipantEntity) private readonly participants: Repository<EmissionParticipantEntity>,
    @InjectRepository(EmissionTradingEntity) private readonly trades: Repository<EmissionTradingEntity>,
    @InjectRepository(NdcTargetEntity) private readonly ndc: Repository<NdcTargetEntity>,
    @InjectRepository(RecognizedMitigationEntity) private readonly mitigation: Repository<RecognizedMitigationEntity>,
    @InjectRepository(ReddPlusEntity) private readonly reddPlus: Repository<ReddPlusEntity>,
  ) {}

  async load(scenario: DemoSeedScenario, forceReplace = false): Promise<DemoSeedLoadResult> {
    const counts = await this.counts();
    if (!forceReplace && nonCertificatePlanIsComplete(counts)) return { status: "unchanged", hash: scenario.hash };
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
      const stage = [ProgrammeStage.NEW, ProgrammeStage.AUTHORISED, ProgrammeStage.APPROVED, ProgrammeStage.AWAITING_AUTHORIZATION, ProgrammeStage.REJECTED][index % 5];
      const hasIssuedCredits = stage === ProgrammeStage.AUTHORISED || stage === ProgrammeStage.APPROVED;
      return { programmeId: `champa-demo-programme-${String(ordinal).padStart(4, "0")}`, externalId: `${PREFIX}PROGRAMME-${String(ordinal).padStart(4, "0")}`, title: `${TITLE_PREFIX}${sector} transition programme ${ordinal}`, serialNo: `${PREFIX}SERIAL-${ordinal}`, sector, sectoralScope: SCOPES[index % SCOPES.length], countryCodeA2: "LA", currentStage: stage, startTime: start, endTime: start + 315360000, creditEst: credit, creditIssued: hasIssuedCredits ? credit : 0, creditBalance: hasIssuedCredits ? Math.floor(credit * .68) : 0, emissionReductionAchieved: Math.floor(credit * .84), creditRetired: [Math.floor(credit * .12)], creditCancelled: [Math.floor(credit * .04)], creditAssignedToExchange: [Math.floor(credit * .08)], proponentTaxVatId: [developer.taxId], companyId: [developer.companyId], article6trade: false, creditUnit: "tCO2e", programmeProperties: { geographicalLocation: [PROVINCES[index % PROVINCES.length]], greenHouseGasses: ["CO2"], estimatedProgrammeCostUSD: 200000 + index * 12000 }, txTime: start, createdTime: start, createdAt: new Date(start * 1000), updatedAt: new Date(start * 1000) } as unknown as Programme;
    }));
    await this.adaptations.save(Array.from({ length: 120 }, (_, index) => this.adaptations.create({ adaptationId: `${PREFIX}ADAPT-${index + 1}`, title: `${TITLE_PREFIX}resilience action ${index + 1}`, description: "Synthetic 2021–2026 public demonstration record; not an official programme.", sector: ADAPTATION_SECTORS[index % ADAPTATION_SECTORS.length], region: PROVINCES[index % PROVINCES.length], companyId: developers[index % developers.length].companyId, currentStage: [AdaptationStage.APPROVED, AdaptationStage.UNDER_REVIEW, AdaptationStage.SUBMITTED][index % 3], createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    await this.communities.save(Array.from({ length: 120 }, (_, index) => this.communities.create({ programId: `${PREFIX}COMMUNITY-${index + 1}`, name: `${TITLE_PREFIX}community climate action ${index + 1}`, region: PROVINCES[index % PROVINCES.length], category: [CommunityProgramCategory.ADAPTATION, CommunityProgramCategory.MITIGATION, CommunityProgramCategory.BOTH][index % 3], description: "Synthetic community demonstration record; not an official programme.", participantCount: 80 + (index % 40) * 25, startYear: 2021 + (index % 6), status: [CommunityProgramStatus.ACTIVE, CommunityProgramStatus.COMPLETED, CommunityProgramStatus.PLANNED][index % 3], createdAt: now - index * 86400000, updatedAt: now - index * 86400000 })));
    await this.reddPlus.save(REDD_PLUS_FIXTURES.map(([province, hectares, reduction, implementingEntity], index) => this.reddPlus.create({
      province,
      title: `${TITLE_PREFIX}REDD+ forest carbon action ${index + 1}`,
      description: `Synthetic REDD+ demonstration activity in ${province}; not an official programme.`,
      forestAreaHectares: hectares,
      estimatedEmissionReductionTco2e: reduction,
      implementingEntity,
      status: [ReddPlusStatus.ONGOING, ReddPlusStatus.ONGOING, ReddPlusStatus.PROPOSED][index % 3],
      startYear: 2021 + (index % 6),
      version: 1,
      published: true,
      createdAt: now - index * 86400000,
      updatedAt: now - index * 86400000,
    })));
    const financeFixtures: Array<[string, FinanceChannel, string, Sector, number, number, FinancialInstrument]> = [
      ["Forest Landscape Programme Finance", FinanceChannel.MULTILATERAL, "World Bank", Sector.Forestry, 25000000000, 1200000, FinancialInstrument.CONCESSIONAL_LOAN],
      ["Climate Readiness Support", FinanceChannel.MULTILATERAL, "Green Climate Fund", Sector.Energy, 18000000000, 1100000, FinancialInstrument.GRANT],
      ["Renewable Energy Grant", FinanceChannel.BILATERAL, "Nordic Development Fund", Sector.Energy, 12000000000, 1600000, FinancialInstrument.GRANT],
      ["Climate Resilient Agriculture Grant", FinanceChannel.BILATERAL, "JICA", Sector.Agriculture, 10000000000, 1500000, FinancialInstrument.GRANT],
      ["Municipal Waste Management Loan", FinanceChannel.MULTILATERAL, "Asian Development Bank", Sector.Waste, 30000000000, 1300000, FinancialInstrument.CONCESSIONAL_LOAN],
      ["Climate Adaptation Technical Assistance", FinanceChannel.BILATERAL, "European Union", Sector.Other, 12000000000, 1350000, FinancialInstrument.GRANT],
    ];
    await this.climateFinance.save(financeFixtures.map(([title, channel, implementer, sector, lak, usd, financialInstrument], index) => this.climateFinance.create({
      title: `${TITLE_PREFIX}${title}`,
      description: `Synthetic climate finance demonstration entry for ${title}; not an official financial record.`,
      channel,
      recipientEntity: `${TITLE_PREFIX}public climate programme ${index + 1}`,
      implementingEntity: implementer,
      dateSigned: Math.floor((now - (index + 1) * 45 * 86400000) / 1000),
      dateClosing: Math.floor((now + (index + 2) * 180 * 86400000) / 1000),
      amountLAK: lak,
      amountUSD: usd,
      sector,
      financialInstrument,
      status: index === 3 ? FinanceStatus.FULLY_DISBURSED : FinanceStatus.ONGOING,
      type: index % 3 === 0 ? ClimateActionType.MITIGATION : index % 3 === 1 ? ClimateActionType.CROSS_CUTTING : ClimateActionType.ADAPTATION,
      createdAt: now - index * 86400000,
      updatedAt: now - index * 86400000,
    })));
    const technologyFixtures: Array<[string, string, string, string, string]> = [
      ["Floating Solar Pilot Transfer", "Solar PV", "Electricite du Laos", "Nam Ngum 1 Reservoir", "Energy"],
      ["Biogas Digester Manufacturing Transfer", "Biogas", "Lao Green Energy Co Ltd", "Vientiane Capital", "Waste"],
      ["Smart Grid Monitoring Transfer", "Grid digitalisation", "Ministry of Energy and Mines", "National grid", "Energy"],
      ["Improved Cookstove Manufacturing Transfer", "Cookstoves", "Department of Forestry (MAE)", "Northern provinces", "Energy"],
    ];
    await this.technologyTransfers.save(technologyFixtures.map(([title, technologyType, recipientEntity, location, sector], index) => this.technologyTransfers.create({
      title: `${TITLE_PREFIX}${title}`,
      description: `Synthetic technology cooperation demonstration focused on ${location}; not an official transfer record.`,
      technologyType,
      timeframe: `${2023 + index}-${2027 + index}`,
      recipientEntity,
      implementingEntity: "Ministry of Energy and Mines",
      type: ClimateActionType.MITIGATION,
      sector,
      subsector: "Climate technology",
      status: index % 3 === 0 ? SupportStatus.COMPLETED : SupportStatus.ON_GOING,
      impactEstimatedResult: "Synthetic demonstration result for local operation and maintenance capacity.",
      additionalInformation: "Synthetic demonstration record; not an official programme.",
      createdAt: now - index * 86400000,
      updatedAt: now - index * 86400000,
    })));
    const capacityFixtures: Array<[string, string, string]> = [
      ["National GHG Inventory Training", "MAE technical staff", "Forestry and Energy"],
      ["Sub-national MRV Training", "Provincial DAE officers", "Cross-sector"],
      ["Carbon Project Development Workshops", "Prospective project developers", "Energy and Agriculture"],
      ["Climate Finance Proposal Bootcamp", "MAE Climate Change Division", "Cross-sector"],
    ];
    await this.capacityBuilding.save(capacityFixtures.map(([title, recipientEntity, sector], index) => this.capacityBuilding.create({
      title: `${TITLE_PREFIX}${title}`,
      description: `Synthetic capacity building demonstration for national MRV and carbon market readiness; not an official training record.`,
      timeframe: `${2023 + index}-${2024 + index}`,
      recipientEntity,
      implementingEntity: "Ministry of Agriculture and Environment",
      type: ClimateActionType.CROSS_CUTTING,
      sector,
      subsector: "Institutional capacity",
      status: index % 3 === 0 ? SupportStatus.COMPLETED : SupportStatus.ON_GOING,
      impactEstimatedResult: "Synthetic demonstration result for NDC tracking and reporting capacity.",
      additionalInformation: "Synthetic demonstration record; not an official programme.",
      createdAt: now - index * 86400000,
      updatedAt: now - index * 86400000,
    })));
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
      this.programmes.delete({ externalId: Like(`${PREFIX}PROGRAMME-%`) }), this.adaptations.delete({ adaptationId: Like(`${PREFIX}ADAPT-%`) }), this.communities.delete({ programId: Like(`${PREFIX}COMMUNITY-%`) }), this.methodologies.delete({ methodologyNumber: Like(`${PREFIX}METH-%`) }), this.experts.delete({ name: Like(`${TITLE_PREFIX}%`) }), this.documents.delete({ title: Like(`${TITLE_PREFIX}%`) }), this.climateFinance.delete({ title: Like(`${TITLE_PREFIX}%`) }), this.technologyTransfers.delete({ title: Like(`${TITLE_PREFIX}%`) }), this.capacityBuilding.delete({ title: Like(`${TITLE_PREFIX}%`) }), this.climateFinance.delete({ title: In(LEGACY_RESOURCE_TITLES) }), this.technologyTransfers.delete({ title: In(LEGACY_RESOURCE_TITLES) }), this.capacityBuilding.delete({ title: In(LEGACY_RESOURCE_TITLES) }), this.trades.delete({ idempotencyKey: Like(`${PREFIX}TRADE-%`) }), this.mitigation.delete({ referenceId: Like(`${PREFIX}MITIGATION-%`) }), this.ndc.delete({ notes: "Synthetic demonstration NDC series; not official statistics." }), this.reddPlus.delete({ title: Like(`${TITLE_PREFIX}REDD+%`) }), this.reddPlus.delete({ title: In(REDD_LEGACY_TITLES) }),
    ]);
    const demoCompanies = await this.companies.find({ where: { taxId: Like(`${PREFIX}ORG-%`) } });
    const ids = demoCompanies.map(({ companyId }) => companyId);
    if (ids.length) { await this.ceilings.delete({ companyId: In(ids) }); await this.participants.delete({ companyId: In(ids) }); await this.companies.delete({ companyId: In(ids) }); }
  }

  private async counts(): Promise<Record<string, number>> {
    const [organisations, programmes, adaptation, community, methodologies, experts, documents, participants, trades, ndc, reddPlus] = await Promise.all([
      this.companies.countBy({ taxId: Like(`${PREFIX}ORG-%`) }), this.programmes.countBy({ externalId: Like(`${PREFIX}PROGRAMME-%`) }), this.adaptations.countBy({ adaptationId: Like(`${PREFIX}ADAPT-%`) }), this.communities.countBy({ programId: Like(`${PREFIX}COMMUNITY-%`) }), this.methodologies.countBy({ methodologyNumber: Like(`${PREFIX}METH-%`) }), this.experts.countBy({ name: Like(`${TITLE_PREFIX}%`) }), this.documents.countBy({ title: Like(`${TITLE_PREFIX}%`) }), this.participants.countBy({ facilityName: Like(`${TITLE_PREFIX}%`) }), this.trades.countBy({ idempotencyKey: Like(`${PREFIX}TRADE-%`) }), this.ndc.countBy({ notes: "Synthetic demonstration NDC series; not official statistics." }), this.reddPlus.countBy({ title: Like(`${TITLE_PREFIX}REDD+%`) }),
    ]);
    return { organisations, programmes, adaptation, community, methodologies, experts, documents, participants, trades, ndc, reddPlus };
  }
}
