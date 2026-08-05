import { CompanyService } from "@app/shared/company/company.service";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SectoralScope } from "@undp/serial-number-gen";

import { Company } from "@app/shared/entities/company.entity";
import { User } from "@app/shared/entities/user.entity";
import { Programme } from "@app/shared/entities/programme.entity";
import { CompanyRole } from "@app/shared/enum/company.role.enum";
import { ProponentCategory } from "@app/shared/enum/proponent.category.enum";
import { CompanyState } from "@app/shared/enum/company.state.enum";
import { Sector } from "@app/shared/enum/sector.enum";
import { GHGs } from "@app/shared/enum/ghgs.enum";
import { ProgrammeStage } from "@app/shared/enum/programme-status.enum";

import { ProgrammeService } from "@app/shared/programme/programme.service";
import { ProgrammeDto } from "@app/shared/dto/programme.dto";
import { AdaptationService } from "@app/shared/adaptation/adaptation.service";
import { AdaptationCreateDto } from "@app/shared/dto/adaptation.create.dto";
import { AdaptationSector } from "@app/shared/enum/adaptation.sector.enum";
import { AdaptationStage } from "@app/shared/enum/adaptation.stage.enum";
import { CommunityProgramService } from "@app/shared/community-program/community.program.service";
import { CommunityProgramCreateDto } from "@app/shared/dto/community.program.create.dto";
import { CommunityProgramCategory } from "@app/shared/enum/community.program.category.enum";
import { CommunityProgramStatus } from "@app/shared/enum/community.program.status.enum";
import { ReddPlusService } from "@app/shared/redd-plus/redd.plus.service";
import { ReddPlusCreateDto } from "@app/shared/dto/redd.plus.create.dto";
import { ReddPlusStatus } from "@app/shared/enum/redd.plus.status.enum";
import { ClimateFinanceService } from "@app/shared/climate-finance/climate.finance.service";
import { ClimateFinanceCreateDto } from "@app/shared/dto/climate.finance.create.dto";
import { FinanceChannel } from "@app/shared/enum/finance.channel.enum";
import { FinancialInstrument } from "@app/shared/enum/finance.instrument.enum";
import { FinanceStatus } from "@app/shared/enum/finance.status.enum";
import { ClimateActionType } from "@app/shared/enum/climate.action.type.enum";
import { TechnologyTransferService } from "@app/shared/technology-transfer/technology.transfer.service";
import { TechnologyTransferCreateDto } from "@app/shared/dto/technology.transfer.create.dto";
import { CapacityBuildingService } from "@app/shared/capacity-building/capacity.building.service";
import { CapacityBuildingCreateDto } from "@app/shared/dto/capacity.building.create.dto";
import { SupportStatus } from "@app/shared/enum/support.status.enum";
import { NdcTargetService } from "@app/shared/ndc-target/ndc.target.service";
import { NdcTargetCreateDto } from "@app/shared/dto/ndc.target.create.dto";
import { NdcSector } from "@app/shared/enum/ndc.sector.enum";
import { EmissionTradingService } from "@app/shared/emission-trading/emission.trading.service";
import { EmissionCeilingCreateDto } from "@app/shared/dto/emission.ceiling.create.dto";
import { EmissionTradingCreateDto } from "@app/shared/dto/emission.trading.create.dto";
import { EmissionParticipantCreateDto } from "@app/shared/dto/emission.participant.create.dto";
import { ExpertService } from "@app/shared/expert/expert.service";
import { ExpertCreateDto } from "@app/shared/dto/expert.create.dto";
import { ExpertStatus } from "@app/shared/enum/expert.status.enum";
import { GuidanceDocumentService } from "@app/shared/guidance-document/guidance.document.service";
import { GuidanceDocumentCreateDto } from "@app/shared/dto/guidance.document.create.dto";
import { RecognizedMitigationService } from "@app/shared/recognized-mitigation/recognized.mitigation.service";
import { RecognizedMitigationCreateDto } from "@app/shared/dto/recognized.mitigation.create.dto";
import { RecognizedMitigationStatus } from "@app/shared/enum/recognized.mitigation.status.enum";
import { buildDemoSeedScenario } from "./scenario";
import { assertSafeDemoSeedEnvironment } from "./safety";

// Deterministic small PRNG so re-runs (and different operators) produce the
// same demo dataset shape - not cryptographic, just reproducible seeding.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PROVINCES = [
  "Vientiane Capital",
  "Phongsaly",
  "Luang Namtha",
  "Oudomxay",
  "Bokeo",
  "Luang Prabang",
  "Houaphanh",
  "Xayaboury",
  "Xiangkhouang",
  "Vientiane Province",
  "Bolikhamxay",
  "Khammouane",
  "Savannakhet",
  "Salavan",
  "Sekong",
  "Champasak",
  "Attapeu",
  "Xaisomboun",
];

// Demo-only project developer / certifier companies, additive to the 9
// organisations already loaded from organisations.csv (which stays the
// source of truth for the 4 real login accounts documented in
// README-LAOS.md). These exist purely to give the registry more than a
// single proponent so proponentsByRole / company-count widgets aren't
// trivially "1 of everything" - same honesty rule as the rest of this
// fork: plausible Lao-style names, never claimed as real registered
// entities anywhere in the UI or docs.
const EXTRA_COMPANIES: Array<{
  name: string;
  taxId: string;
  role: CompanyRole;
  email: string;
  province: string;
  // Derived from each company's own name/legal form (Co Ltd/Enterprise vs
  // Cooperative) - the same "honest, not guessed" rule as the rest of this
  // seeder, not an invented classification.
  proponentCategory: ProponentCategory;
}> = [
  {
    name: "Vientiane Solar Development Co., Ltd",
    taxId: "20002LA",
    role: CompanyRole.PROJECT_DEVELOPER,
    email: "info@vientianesolar.la",
    province: "Vientiane Capital",
    proponentCategory: ProponentCategory.PRIVATE_SECTOR,
  },
  {
    name: "Mekong Biogas Solutions Sole Co., Ltd",
    taxId: "20003LA",
    role: CompanyRole.PROJECT_DEVELOPER,
    email: "contact@mekongbiogas.la",
    province: "Savannakhet",
    proponentCategory: ProponentCategory.PRIVATE_SECTOR,
  },
  {
    name: "Champasak Agroforestry Cooperative",
    taxId: "20004LA",
    role: CompanyRole.PROJECT_DEVELOPER,
    email: "office@champasak-agroforestry.la",
    province: "Champasak",
    proponentCategory: ProponentCategory.COMMUNITY_BASED_ORGANISATION,
  },
  {
    name: "Luang Prabang Clean Cookstove Enterprise",
    taxId: "20005LA",
    role: CompanyRole.PROJECT_DEVELOPER,
    email: "hello@lpqcookstove.la",
    province: "Luang Prabang",
    proponentCategory: ProponentCategory.PRIVATE_SECTOR,
  },
];

@Injectable()
export class DemoSeederService {
  private readonly logger = new Logger(DemoSeederService.name);
  private readonly rand = mulberry32(20260804);

  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    private companyService: CompanyService,
    private programmeService: ProgrammeService,
    private adaptationService: AdaptationService,
    private communityProgramService: CommunityProgramService,
    private reddPlusService: ReddPlusService,
    private climateFinanceService: ClimateFinanceService,
    private technologyTransferService: TechnologyTransferService,
    private capacityBuildingService: CapacityBuildingService,
    private ndcTargetService: NdcTargetService,
    private emissionTradingService: EmissionTradingService,
    private expertService: ExpertService,
    private guidanceDocumentService: GuidanceDocumentService,
    private recognizedMitigationService: RecognizedMitigationService
  ) {}

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rand() * arr.length)];
  }

  private int(min: number, max: number): number {
    return Math.floor(this.rand() * (max - min + 1)) + min;
  }

  // Unix seconds, `daysAgo` in the past from a fixed anchor (not
  // `Date.now()`) so re-running the script on a different day doesn't
  // shift every record's age.
  private pastDate(daysAgo: number): number {
    const anchor = Date.parse("2026-08-05T00:00:00Z") / 1000;
    return Math.floor(anchor - daysAgo * 86400);
  }

  async run(): Promise<void> {
    assertSafeDemoSeedEnvironment(process.env);
    const scenario = buildDemoSeedScenario();
    this.logger.log(
      `Demo seeder starting: ${scenario.version}; ${scenario.records.length} fixture records; sha256=${scenario.hash}`
    );

    const guard = await this.programmeRepo.count();
    if (guard > 3) {
      this.logger.warn(
        `Programme table already has ${guard} rows (more than the base seed) - refusing to run twice. ` +
          `This script is additive-only and not idempotent; re-running against an already-seeded ` +
          `database would double up every module. Reset with 'docker compose down -v' first if you ` +
          `want a fresh demo dataset.`
      );
      return;
    }

    const extraCompanies = await this.seedExtraCompanies();
    const mae = await this.companyRepo.findOneBy({ taxId: "00001LA" });
    const energyMinistry = await this.companyRepo.findOneBy({
      taxId: "10001LA",
    });
    const laoGreenEnergy = await this.companyRepo.findOneBy({
      taxId: "20001LA",
    });
    const bureauVeritas = await this.companyRepo.findOneBy({
      taxId: "30001LA",
    });
    const developers = [laoGreenEnergy, ...extraCompanies].filter(Boolean);

    if (!mae || !laoGreenEnergy || !bureauVeritas) {
      this.logger.error(
        "Base seed companies (organisations.csv) not found - run national-api once first so IMPORT_ORG completes, then re-run the seeder."
      );
      return;
    }

    await this.seedProgrammes(developers, mae);
    await this.seedAdaptationProjects(developers);
    await this.seedCommunityPrograms();
    await this.seedReddPlus();
    await this.seedClimateFinance();
    await this.seedTechnologyTransfer();
    await this.seedCapacityBuilding();
    await this.seedNdcTargets();
    await this.seedEmissionCeilingsAndTrading(developers, energyMinistry);
    await this.seedExperts();
    await this.seedGuidanceDocuments();
    await this.seedRecognizedMitigation(developers);

    this.logger.log("Demo seeder finished");
  }

  private async seedExtraCompanies(): Promise<Company[]> {
    const created: Company[] = [];
    for (const c of EXTRA_COMPANIES) {
      const existing = await this.companyRepo.findOneBy({ taxId: c.taxId });
      if (existing) {
        created.push(existing);
        continue;
      }
      // Route through CompanyService.create (not a raw repo insert) so the
      // real companyId counter sequence (CounterType.COMPANY) is used -
      // companyId is an explicit not-null column, not a DB serial.
      const saved = await this.companyService.create({
        taxId: c.taxId,
        name: c.name,
        email: c.email,
        companyRole: c.role,
        address: `${c.province}, Lao PDR`,
        country: "LA",
        state: CompanyState.ACTIVE,
        proponentCategory: c.proponentCategory,
        createdTime: this.pastDate(this.int(200, 500)),
      } as any);
      created.push(saved as Company);
    }

    // Lao Green Energy Co Ltd is the sole base-seed (organisations.csv)
    // Project Developer - classify it from its own legal-form suffix ("Co
    // Ltd") rather than leaving it "Not Specified" forever, same honesty
    // rule as EXTRA_COMPANIES above.
    await this.companyRepo.update(
      { taxId: "20001LA", proponentCategory: null },
      { proponentCategory: ProponentCategory.PRIVATE_SECTOR }
    );

    this.logger.log(`Seeded ${created.length} extra demo companies`);
    return created;
  }

  private buildProgrammeDto(
    title: string,
    sector: Sector,
    sectoralScope: SectoralScope,
    province: string,
    proponentTaxId: string,
    proponentCompanyId: number,
    startDaysAgo: number,
    creditEst: number,
    externalIdSuffix: string
  ): { dto: ProgrammeDto; user: User } {
    const startTime = this.pastDate(startDaysAgo);
    const dto: any = {
      title,
      externalId: `CHAMPA-DEMO-${externalIdSuffix}`,
      sectoralScope,
      sector,
      startTime,
      endTime: startTime + 10 * 365 * 86400,
      proponentTaxVatId: [proponentTaxId],
      article6trade: true,
      creditUnit: "tCO2e",
      programmeProperties: {
        estimatedProgrammeCostUSD: this.int(50000, 4000000),
        geographicalLocation: [province],
        greenHouseGasses: [GHGs.CO2],
      },
      creditEst,
      environmentalAssessmentRegistrationNo: `EARN-${externalIdSuffix}`,
      designDocument:
        "data:application/pdf;base64," +
        Buffer.from(
          `Champa demo design document for ${title}`
        ).toString("base64"),
    };

    const user = {
      companyId: proponentCompanyId,
      companyRole: CompanyRole.PROJECT_DEVELOPER,
    } as User;

    return { dto, user };
  }

  private async seedProgrammes(
    developers: Company[],
    mae: Company
  ): Promise<void> {
    const projects: Array<[string, Sector, SectoralScope, string, number]> = [
      [
        "Nam Ngum River Basin Micro-Hydro Cluster",
        Sector.Energy,
        SectoralScope.EnergyIndustry,
        "Vientiane Province",
        45000,
      ],
      [
        "Xayaboury Grid-Connected Solar Farm",
        Sector.Energy,
        SectoralScope.EnergyIndustry,
        "Xayaboury",
        30000,
      ],
      [
        "Vientiane Capital Rooftop Solar Programme",
        Sector.Energy,
        SectoralScope.EnergyDistribution,
        "Vientiane Capital",
        12000,
      ],
      [
        "Savannakhet Rural Electrification Efficiency Upgrade",
        Sector.Energy,
        SectoralScope.EnergyDemand,
        "Savannakhet",
        8000,
      ],
      [
        "Champasak Sustainable Coffee Agroforestry",
        Sector.Agriculture,
        SectoralScope.Agriculture,
        "Champasak",
        22000,
      ],
      [
        "Bolaven Plateau Improved Rice Cultivation (AWD)",
        Sector.Agriculture,
        SectoralScope.Agriculture,
        "Champasak",
        15000,
      ],
      [
        "Luang Prabang Forest Landscape Restoration",
        Sector.Forestry,
        SectoralScope.AfforestationAndReforestation,
        "Luang Prabang",
        60000,
      ],
      [
        "Houaphanh Community Forest Protection",
        Sector.Forestry,
        SectoralScope.AfforestationAndReforestation,
        "Houaphanh",
        35000,
      ],
      [
        "Vientiane Capital Municipal Solid Waste-to-Energy",
        Sector.Waste,
        SectoralScope.WasteHandlingDisposal,
        "Vientiane Capital",
        40000,
      ],
      [
        "Savannakhet Landfill Gas Capture",
        Sector.Waste,
        SectoralScope.WasteHandlingDisposal,
        "Savannakhet",
        18000,
      ],
      [
        "Vientiane Capital Bus Rapid Transit Fuel Switch",
        Sector.Transport,
        SectoralScope.Transport,
        "Vientiane Capital",
        20000,
      ],
      [
        "Cement Plant Energy Efficiency Retrofit (Vientiane Province)",
        Sector.Manufacturing,
        SectoralScope.ManufacturingIndustries,
        "Vientiane Province",
        27000,
      ],
    ];

    let idx = 0;
    const createdIds: Array<{ programmeId: string; credit: number }> = [];
    for (const [title, sector, scope, province, credit] of projects) {
      idx++;
      const proponent = developers[idx % developers.length];
      const startDaysAgo = this.int(60, 540);
      const { dto, user } = this.buildProgrammeDto(
        title,
        sector,
        scope,
        province,
        proponent.taxId,
        proponent.companyId,
        startDaysAgo,
        credit,
        String(idx).padStart(3, "0")
      );

      try {
        const saved = await this.programmeService.create(dto, user);
        if (!saved) continue;
        createdIds.push({ programmeId: saved.programmeId, credit });
        this.logger.log(`Seeded programme ${saved.programmeId}: ${title}`);
      } catch (e) {
        this.logger.error(`Failed to seed programme "${title}": ${e}`);
      }
    }

    // The ledger-replicator service asynchronously replays each
    // "create programme" event onto the read-model row (near-instantly
    // if it's already running, or as a queued backlog on its next
    // start). Mutating currentStage/credit fields immediately after
    // create() races that replay and gets silently clobbered back to
    // AwaitingAuthorization. Waiting for the backlog to drain before the
    // stage-distribution pass avoids the race - verified empirically
    // against the running replicator container.
    this.logger.log(
      "Waiting for ledger-replicator to settle before applying stage distribution..."
    );
    // Promise.withResolvers() would need Node 22+; this repo's Dockerfile
    // pins node:20-alpine, so the plain executor form is required here.
    await new Promise<void>((resolve) => setTimeout(resolve, 10000));

    for (const { programmeId, credit } of createdIds) {
      const saved = await this.programmeRepo.findOneBy({ programmeId });
      if (!saved) continue;

      // Simulate a realistic post-submission workflow distribution
      // instead of leaving every demo project in the initial
      // AwaitingAuthorization stage: roughly 2/3 progress to
      // Authorised, a couple stay pending, one is rejected - matching
      // the mixed stage spread SRN Indonesia's own live registry
      // shows. Credit fields are only populated for Authorised
      // records, kept internally consistent with creditEst.
      const roll = this.rand();
      if (roll < 0.6) {
        saved.currentStage = ProgrammeStage.AUTHORISED;
        saved.creditIssued = credit;
        saved.creditBalance = Math.round(credit * (0.4 + this.rand() * 0.5));
        saved.creditRetired = [credit - saved.creditBalance];
      } else if (roll < 0.75) {
        saved.currentStage = ProgrammeStage.AWAITING_AUTHORIZATION;
      } else if (roll < 0.9) {
        saved.currentStage = ProgrammeStage.APPROVED;
        saved.creditIssued = credit;
        saved.creditBalance = credit;
      } else {
        saved.currentStage = ProgrammeStage.REJECTED;
      }
      await this.programmeRepo.save(saved);
    }
    this.logger.log(
      `Applied stage distribution to ${createdIds.length} programmes`
    );
  }

  private async seedAdaptationProjects(developers: Company[]): Promise<void> {
    const items: Array<[string, AdaptationSector, string, string]> = [
      [
        "Xiangkhouang Terrace Water Retention",
        AdaptationSector.WATER_SECURITY,
        "Xiangkhouang",
        "Terracing and water-retention structures to reduce upland erosion and improve dry-season irrigation resilience.",
      ],
      [
        "Champasak Flood-Resilient Rice Variety Trial",
        AdaptationSector.FOOD_SECURITY,
        "Champasak",
        "Field trial of flood-tolerant rice varieties for Mekong floodplain communities facing longer wet-season inundation.",
      ],
      [
        "Vientiane Capital Urban Drainage Climate-Proofing",
        AdaptationSector.URBAN_AND_RURAL_SETTLEMENTS,
        "Vientiane Capital",
        "Upgrading municipal drainage capacity to withstand more intense monsoon rainfall events.",
      ],
      [
        "Luang Namtha Highland Water Source Protection",
        AdaptationSector.WATER_SECURITY,
        "Luang Namtha",
        "Spring and watershed protection for highland villages facing dry-season water scarcity.",
      ],
      [
        "Attapeu Post-Flood Livelihood Diversification",
        AdaptationSector.FOOD_SECURITY,
        "Attapeu",
        "Diversifying household livelihoods away from flood-exposed lowland farming toward mixed agroforestry.",
      ],
      [
        "Bokeo Riverbank Erosion Control",
        AdaptationSector.INFRASTRUCTURE,
        "Bokeo",
        "Bioengineering riverbank stabilisation to protect riverside settlements from erosion.",
      ],
      [
        "Khammouane Karst Watershed Ecosystem Resilience",
        AdaptationSector.ECOSYSTEM_RESILIENCE,
        "Khammouane",
        "Protecting karst watershed forest cover that buffers downstream communities against flash flooding.",
      ],
      [
        "Salavan Community Health Heat-Resilience Programme",
        AdaptationSector.HEALTH,
        "Salavan",
        "Community health worker training and cooling shelters for extreme heat events.",
      ],
    ];

    for (const [title, sector, region, description] of items) {
      const proponent = this.pick(developers);
      const dto: AdaptationCreateDto = {
        title,
        description,
        sector,
        region,
      };
      const user = {
        companyId: proponent.companyId,
        companyRole: CompanyRole.PROJECT_DEVELOPER,
      } as User;
      try {
        const saved = await this.adaptationService.create(dto, user);
        const roll = this.rand();
        saved.currentStage =
          roll < 0.5
            ? AdaptationStage.APPROVED
            : roll < 0.8
              ? AdaptationStage.UNDER_REVIEW
              : AdaptationStage.SUBMITTED;
        await this.adaptationService.updateStage(
          saved.id,
          { stage: saved.currentStage },
          { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY } as User
        );
        this.logger.log(`Seeded adaptation project: ${title}`);
      } catch (e) {
        this.logger.error(`Failed to seed adaptation project "${title}": ${e}`);
      }
    }
  }

  private async seedCommunityPrograms(): Promise<void> {
    const items: Array<
      [string, string, CommunityProgramCategory, number, string]
    > = [
      [
        "Vientiane Household Biogas Digesters",
        "Vientiane Capital",
        CommunityProgramCategory.MITIGATION,
        850,
        "Small-scale household biogas digester program reducing methane from livestock waste, below full Programme certification threshold.",
      ],
      [
        "Ban Nampheng Community Solar Cookstove Initiative",
        "Luang Prabang",
        CommunityProgramCategory.MITIGATION,
        220,
        "Village-level distribution of solar cookstoves to reduce fuelwood dependence and household air pollution.",
      ],
      [
        "Khammouane School Rainwater Harvesting Network",
        "Khammouane",
        CommunityProgramCategory.ADAPTATION,
        1400,
        "Rainwater harvesting systems installed across rural schools to build dry-season water resilience.",
      ],
      [
        "Sekong Agroforestry and Beekeeping Livelihoods",
        "Sekong",
        CommunityProgramCategory.BOTH,
        310,
        "Combined agroforestry restoration and beekeeping livelihoods programme for upland ethnic communities.",
      ],
      [
        "Xaisomboun Community Fuel-Efficient Stove Rollout",
        "Xaisomboun",
        CommunityProgramCategory.MITIGATION,
        640,
        "District-wide fuel-efficient stove distribution reducing household firewood consumption.",
      ],
      [
        "Oudomxay Village Flood Early-Warning Network",
        "Oudomxay",
        CommunityProgramCategory.ADAPTATION,
        95,
        "Community-operated flood early-warning stations along tributary rivers.",
      ],
    ];

    for (const [name, region, category, participants, description] of items) {
      const startYear = 2024 + this.int(0, 2);
      const dto: CommunityProgramCreateDto = {
        name,
        region,
        category,
        description,
        participantCount: participants,
        startYear,
        status:
          startYear < 2026
            ? CommunityProgramStatus.ACTIVE
            : CommunityProgramStatus.PLANNED,
      };
      try {
        await this.communityProgramService.create(dto);
        this.logger.log(`Seeded community program: ${name}`);
      } catch (e) {
        this.logger.error(`Failed to seed community program "${name}": ${e}`);
      }
    }
  }

  private async seedReddPlus(): Promise<void> {
    const items: Array<[string, string, number, number, string]> = [
      [
        "Nam Kading Protected Area REDD+ Pilot",
        "Bolikhamxay",
        18500,
        95000,
        "National Protected Area",
      ],
      [
        "Nam Et-Phou Louey Forest Carbon Pilot",
        "Houaphanh",
        42000,
        210000,
        "National Protected Area",
      ],
      [
        "Dong Khanthung Community Forest REDD+",
        "Champasak",
        9000,
        38000,
        "Department of Forestry (MAE)",
      ],
      [
        "Nam Phui Watershed Deforestation Reduction",
        "Xayaboury",
        21000,
        88000,
        "Department of Forestry (MAE)",
      ],
    ];

    for (const [title, province, reduction, hectares, entity] of items) {
      const dto: ReddPlusCreateDto = {
        province,
        title,
        description: `Avoided deforestation and forest degradation activities in ${province}, implemented under Lao PDR's national REDD+ programme.`,
        forestAreaHectares: hectares,
        estimatedEmissionReductionTco2e: reduction,
        implementingEntity: entity,
        status: this.pick([
          ReddPlusStatus.ONGOING,
          ReddPlusStatus.ONGOING,
          ReddPlusStatus.PROPOSED,
        ]),
        startYear: 2023 + this.int(0, 3),
      };
      try {
        await this.reddPlusService.create(dto);
        this.logger.log(`Seeded REDD+ activity: ${title}`);
      } catch (e) {
        this.logger.error(`Failed to seed REDD+ activity "${title}": ${e}`);
      }
    }
  }

  private async seedClimateFinance(): Promise<void> {
    const items: Array<
      [string, string, FinanceChannel, string, Sector, number, number]
    > = [
      [
        "Green Climate Fund Readiness Support",
        "MAE Climate Change Division",
        FinanceChannel.MULTILATERAL,
        "Green Climate Fund",
        Sector.Energy,
        0,
        3200000,
      ],
      [
        "Nordic Climate Facility Renewable Energy Grant",
        "Ministry of Energy and Mines",
        FinanceChannel.BILATERAL,
        "Nordic Development Fund",
        Sector.Energy,
        0,
        1800000,
      ],
      [
        "World Bank Forest Landscape Programme Loan",
        "Department of Forestry (MAE)",
        FinanceChannel.MULTILATERAL,
        "World Bank",
        Sector.Forestry,
        45000000000,
        0,
      ],
      [
        "JICA Climate-Resilient Agriculture Grant",
        "MAE Agriculture Resilience Unit",
        FinanceChannel.BILATERAL,
        "JICA",
        Sector.Agriculture,
        0,
        2100000,
      ],
      [
        "ADB Municipal Waste Management Concessional Loan",
        "Vientiane Capital Urban Development Office",
        FinanceChannel.MULTILATERAL,
        "Asian Development Bank",
        Sector.Waste,
        62000000000,
        0,
      ],
      [
        "EU Climate Adaptation Technical Assistance",
        "MAE Climate Change Division",
        FinanceChannel.BILATERAL,
        "European Union",
        Sector.Other,
        0,
        950000,
      ],
    ];

    for (const [
      title,
      recipient,
      channel,
      implementer,
      sector,
      lak,
      usd,
    ] of items) {
      const startDaysAgo = this.int(90, 700);
      const dto: ClimateFinanceCreateDto = {
        title,
        description: `${title}, supporting Lao PDR's national climate priorities under the NDC implementation plan.`,
        channel,
        recipientEntity: recipient,
        implementingEntity: implementer,
        dateSigned: this.pastDate(startDaysAgo),
        dateClosing: this.pastDate(startDaysAgo - 3 * 365),
        amountLAK: lak || undefined,
        amountUSD: usd || undefined,
        sector,
        financialInstrument:
          channel === FinanceChannel.MULTILATERAL && lak > 0
            ? FinancialInstrument.CONCESSIONAL_LOAN
            : FinancialInstrument.GRANT,
        status: this.pick([
          FinanceStatus.ONGOING,
          FinanceStatus.ONGOING,
          FinanceStatus.FULLY_DISBURSED,
        ]),
        type: ClimateActionType.MITIGATION,
      };
      try {
        await this.climateFinanceService.create(dto);
        this.logger.log(`Seeded climate finance entry: ${title}`);
      } catch (e) {
        this.logger.error(`Failed to seed climate finance "${title}": ${e}`);
      }
    }
  }

  private async seedTechnologyTransfer(): Promise<void> {
    const items: Array<[string, string, string, string]> = [
      [
        "Floating Solar PV Pilot Technology Transfer",
        "Solar PV",
        "Electricite du Laos",
        "Nam Ngum 1 Reservoir",
      ],
      [
        "Biogas Digester Manufacturing Know-How Transfer",
        "Biogas",
        "Lao Green Energy Co Ltd",
        "Vientiane Capital",
      ],
      [
        "Smart Meter and Grid Monitoring Technology",
        "Grid Digitalisation",
        "Ministry of Energy and Mines",
        "National Grid",
      ],
      [
        "Improved Cookstove Local Manufacturing Transfer",
        "Cookstoves",
        "Department of Forestry (MAE)",
        "Northern Provinces",
      ],
    ];

    for (const [title, techType, recipient, location] of items) {
      const dto: TechnologyTransferCreateDto = {
        title,
        description: `${title} under a technology cooperation agreement, focused on ${location}.`,
        technologyType: techType,
        timeframe: `${2024 + this.int(0, 1)}-${2027 + this.int(0, 2)}`,
        recipientEntity: recipient,
        implementingEntity: "Ministry of Energy and Mines",
        type: ClimateActionType.MITIGATION,
        sector: "Energy",
        status: this.pick([SupportStatus.ON_GOING, SupportStatus.COMPLETED]),
        impactEstimatedResult: "Reduced technical losses and improved local O&M capacity.",
      };
      try {
        await this.technologyTransferService.create(dto);
        this.logger.log(`Seeded technology transfer record: ${title}`);
      } catch (e) {
        this.logger.error(`Failed to seed technology transfer "${title}": ${e}`);
      }
    }
  }

  private async seedCapacityBuilding(): Promise<void> {
    const items: Array<[string, string, string]> = [
      [
        "National GHG Inventory Training Programme",
        "MAE technical staff",
        "Forestry and Energy",
      ],
      [
        "MRV System Training for Sub-National Officers",
        "Provincial DAE officers",
        "Cross-sector",
      ],
      [
        "Carbon Project Development Workshop Series",
        "Prospective project developers",
        "Energy and Agriculture",
      ],
      [
        "Climate Finance Proposal Writing Bootcamp",
        "MAE Climate Change Division",
        "Cross-sector",
      ],
    ];

    for (const [title, recipient, sector] of items) {
      const dto: CapacityBuildingCreateDto = {
        title,
        description: `${title}, delivered with international technical partner support to strengthen national MRV and carbon market readiness.`,
        timeframe: `${2024 + this.int(0, 2)}`,
        recipientEntity: recipient,
        implementingEntity: "Ministry of Agriculture and Environment",
        type: ClimateActionType.CROSS_CUTTING,
        sector,
        status: this.pick([SupportStatus.COMPLETED, SupportStatus.ON_GOING]),
        impactEstimatedResult: "Improved institutional capacity for NDC tracking and reporting.",
      };
      try {
        await this.capacityBuildingService.create(dto);
        this.logger.log(`Seeded capacity building record: ${title}`);
      } catch (e) {
        this.logger.error(`Failed to seed capacity building "${title}": ${e}`);
      }
    }
  }

  private async seedNdcTargets(): Promise<void> {
    // Illustrative NDC trajectory rows only (prototype, not tied to Lao
    // PDR's actual submitted NDC figures) - matches the honesty framing
    // already documented in README-LAOS.md for this module.
    const baselines: Record<NdcSector, number> = {
      [NdcSector.ENERGY]: 12500,
      [NdcSector.IPPU]: 3100,
      [NdcSector.AGRICULTURE]: 8600,
      [NdcSector.FORESTRY]: -21000,
      [NdcSector.WASTE]: 2400,
    };
    const targetFactor: Record<NdcSector, number> = {
      [NdcSector.ENERGY]: 0.82,
      [NdcSector.IPPU]: 0.9,
      [NdcSector.AGRICULTURE]: 0.88,
      [NdcSector.FORESTRY]: 1.35,
      [NdcSector.WASTE]: 0.75,
    };

    for (const sector of Object.values(NdcSector)) {
      for (let year = 2023; year <= 2026; year++) {
        const baseline = baselines[sector];
        const target = Math.round(baseline * targetFactor[sector]);
        const progress = (year - 2023) / (2030 - 2023);
        const achieved = Math.round(
          baseline + (target - baseline) * progress * (0.6 + this.rand() * 0.3)
        );
        const dto: NdcTargetCreateDto = {
          year,
          sector,
          baselineEmissions: baseline,
          targetEmissions2030: target,
          achievedEmissions: achieved,
          claimedEmissions: Math.round(achieved * (0.9 + this.rand() * 0.2)),
          notes: `Prototype NDC tracking row for ${sector}, ${year}.`,
        };
        try {
          await this.ndcTargetService.create(dto);
        } catch (e) {
          this.logger.error(
            `Failed to seed NDC target ${sector}/${year}: ${e}`
          );
        }
      }
    }
    this.logger.log("Seeded NDC target trajectory rows");
  }

  private async seedEmissionCeilingsAndTrading(
    developers: Company[],
    energyMinistry: Company
  ): Promise<void> {
    for (const company of developers) {
      for (const year of [2025, 2026]) {
        const dto: EmissionCeilingCreateDto = {
          companyId: company.companyId,
          year,
          units: this.int(50000, 500000),
          seriesName: `${company.name.split(" ")[0]} Ceiling ${year}`,
          sector: "Energy",
        };
        try {
          await this.emissionTradingService.createCeiling(dto);
        } catch (e) {
          this.logger.error(
            `Failed to seed emission ceiling for ${company.name}: ${e}`
          );
        }
      }

      const partDto: EmissionParticipantCreateDto = {
        companyId: company.companyId,
        facilityName: `${company.name.split(" ")[0]} Generation Facility`,
        capacityDescription: `${this.int(5, 700)} MW`,
        year: 2026,
      };
      try {
        await this.emissionTradingService.createParticipant(partDto);
      } catch (e) {
        this.logger.error(
          `Failed to seed emission participant for ${company.name}: ${e}`
        );
      }
    }

    if (developers.length >= 2) {
      for (let i = 0; i < 3; i++) {
        const seller = developers[i % developers.length];
        const buyer = developers[(i + 1) % developers.length];
        const dto: EmissionTradingCreateDto = {
          sellerCompanyId: seller.companyId,
          buyerCompanyId: buyer.companyId,
          units: this.int(1000, 20000),
          valueLAK: this.int(500, 5000) * 1000000,
          tradeDate: this.pastDate(this.int(10, 300)),
        };
        try {
          await this.emissionTradingService.createTrading(dto);
        } catch (e) {
          this.logger.error(`Failed to seed emission trading record: ${e}`);
        }
      }
    }
    this.logger.log("Seeded emission ceilings, participants, and trading records");
  }

  private async seedExperts(): Promise<void> {
    const items: Array<[string, string, string, string, number]> = [
      [
        "Dr. Somchai Vongsa",
        "National University of Laos, Faculty of Environmental Science",
        "GHG inventory methodology, MRV systems, forestry carbon accounting",
        "Vientiane Capital",
        12,
      ],
      [
        "Ms. Khamla Sisavath",
        "Ministry of Agriculture and Environment",
        "Climate finance proposal development, NDC tracking",
        "Vientiane Capital",
        9,
      ],
      [
        "Mr. Bounmy Phetsavanh",
        "Department of Forestry (MAE)",
        "REDD+ safeguards, forest inventory, remote sensing",
        "Luang Prabang",
        15,
      ],
      [
        "Ms. Anousone Keomany",
        "Independent Consultant",
        "Renewable energy project appraisal, Article 6 readiness",
        "Vientiane Capital",
        7,
      ],
    ];

    for (const [name, affiliation, expertise, province, years] of items) {
      const dto: ExpertCreateDto = {
        name,
        affiliation,
        expertise,
        certification: "UNFCCC Roster of Experts (Forestry)",
        yearsOfExperience: years,
        province,
        status: ExpertStatus.ACTIVE,
      };
      try {
        await this.expertService.create(dto);
        this.logger.log(`Seeded expert: ${name}`);
      } catch (e) {
        this.logger.error(`Failed to seed expert "${name}": ${e}`);
      }
    }
  }

  private async seedGuidanceDocuments(): Promise<void> {
    const items: Array<[string, string, string]> = [
      [
        "Guideline on Carbon Credit Registration Procedures",
        "Registration Guidance",
        "Step-by-step guidance for project developers submitting mitigation programmes under the Decree on Carbon Credits.",
      ],
      [
        "Module Guidance on NDC Mitigation Action Tracking",
        "NDC Guidance",
        "Guidance for MAE/Ministry staff working with Champa's NDC Achievement module and sector-level trajectory data.",
      ],
      [
        "REDD+ Safeguards Information System Handbook",
        "REDD+ Guidance",
        "National REDD+ safeguards reporting requirements for forest carbon project proponents.",
      ],
      [
        "Adaptation Project Submission Checklist",
        "Adaptation Guidance",
        "Checklist for project developers preparing adaptation project submissions across the 9 recognised sectors.",
      ],
    ];

    for (const [title, category, description] of items) {
      const dto: GuidanceDocumentCreateDto = {
        title,
        description,
        category,
        documentUrl:
          "data:application/pdf;base64," +
          Buffer.from(`Champa demo guidance document: ${title}`).toString(
            "base64"
          ),
      };
      try {
        await this.guidanceDocumentService.create(dto);
        this.logger.log(`Seeded guidance document: ${title}`);
      } catch (e) {
        this.logger.error(`Failed to seed guidance document "${title}": ${e}`);
      }
    }
  }

  private async seedRecognizedMitigation(developers: Company[]): Promise<void> {
    const items: Array<[string, Sector, string, number]> = [
      [
        "Vientiane Household Biogas Digesters",
        Sector.Agriculture,
        "Vientiane Capital",
        850,
      ],
      [
        "Ban Nampheng Community Solar Cookstove Initiative",
        Sector.Energy,
        "Luang Prabang",
        410,
      ],
      [
        "Sekong Agroforestry and Beekeeping Livelihoods",
        Sector.Forestry,
        "Sekong",
        1200,
      ],
      [
        "Khammouane Rural Solar Lantern Distribution",
        Sector.Energy,
        "Khammouane",
        260,
      ],
    ];

    for (const [title, sector, region, reduction] of items) {
      const proponent = this.pick(developers);
      const dto: RecognizedMitigationCreateDto = {
        title,
        description: `Small-scale household/community-level mitigation action, below the full Programme certification threshold.`,
        proponentName: proponent.name,
        proponentType: CompanyRole.PROJECT_DEVELOPER,
        proponentCompanyId: proponent.companyId,
        sector,
        region,
        estimatedReductionTco2e: reduction,
        status: this.pick([
          RecognizedMitigationStatus.RECOGNIZED,
          RecognizedMitigationStatus.RECOGNIZED,
          RecognizedMitigationStatus.UNDER_REVIEW,
        ]),
      };
      try {
        await this.recognizedMitigationService.create(dto);
        this.logger.log(`Seeded recognized mitigation action: ${title}`);
      } catch (e) {
        this.logger.error(
          `Failed to seed recognized mitigation action "${title}": ${e}`
        );
      }
    }
  }
}
