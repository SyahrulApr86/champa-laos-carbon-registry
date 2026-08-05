import { HttpStatus } from "@nestjs/common";
import { ProgrammeService } from "./programme.service";
import { CompanyRole } from "../enum/company.role.enum";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { Role } from "../casl/role.enum";
import { TxType } from "../enum/txtype.enum";
import { CreditAuditLogType } from "../enum/credit.audit.log.type.enum";

const helperService = {
  halfUpToPrecision: (value: number, precision = 2) =>
    Number(Number(value).toFixed(precision)),
  formatReqMessagesString: (key: string) => key,
};

const programme = {
  programmeId: "P-001",
  currentStage: ProgrammeStage.AUTHORISED,
  companyId: [10],
  creditOwnerPercentage: [100],
  creditFrozen: [0],
  creditBalance: 100,
};

const requester = {
  id: 7,
  companyId: 10,
  companyName: "Owner",
  companyRole: CompanyRole.PROJECT_DEVELOPER,
  role: Role.Admin,
};

function makeService() {
  const service = Object.create(ProgrammeService.prototype) as ProgrammeService;
  (service as any).helperService = helperService;
  (service as any).programmeLedger = {
    getProgrammeById: jest.fn().mockResolvedValue(programme),
    applyProgrammeCreditStatus: jest
      .fn()
      .mockResolvedValue({ ...programme, creditBalance: 75 }),
  };
  (service as any).createCreditAuditLogRecord = jest.fn();
  (service as any).getUserRefWithRemarks = (user: any, remarks: string) =>
    `${user.companyId}#${user.id}#${remarks || ""}`;
  return service;
}

describe("ProgrammeService credit state transitions", () => {
  it("cancels only the requester's own available credits", async () => {
    const service = makeService();

    const response = await service.cancelProgrammeCredits(
      {
        programmeId: "P-001",
        companyCredit: [25],
        comment: "Voluntary cancellation",
      },
      requester as any
    );

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect((service as any).programmeLedger.applyProgrammeCreditStatus).toHaveBeenCalledWith(
      "P-001",
      [{ companyId: 10, amount: 25 }],
      TxType.CANCEL,
      expect.stringContaining("Voluntary cancellation")
    );
    expect((service as any).createCreditAuditLogRecord).toHaveBeenCalledWith(
      CreditAuditLogType.CREDIT_CANCELLED,
      "P-001",
      25,
      7
    );
  });

  it("rejects an owner attempting to act for another company", async () => {
    const service = makeService();

    await expect(
      service.assignProgrammeCreditsToExchange(
        {
          programmeId: "P-001",
          fromCompanyIds: [99],
          companyCredit: [25],
        },
        requester as any
      )
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });

    expect((service as any).programmeLedger.applyProgrammeCreditStatus).not.toHaveBeenCalled();
  });
});

describe("ProgrammeService canonical public analytics", () => {
  it("reconciles issued chart totals and current certificate state from canonical lots", async () => {
    const service = Object.create(ProgrammeService.prototype) as ProgrammeService;
    (service as any).getPublicSummary = jest.fn().mockResolvedValue({
      stageCounts: { NEW: 1, AUTHORISED: 1 },
    });
    (service as any).programmeRepo = {
      find: jest.fn().mockResolvedValue([
        {
          programmeId: "P-ENERGY",
          sector: "Energy",
          companyId: [10],
          proponentPercentage: [100],
          emissionReductionAchieved: 80,
        },
        {
          programmeId: "P-WASTE",
          sector: "Waste",
          companyId: [11],
          proponentPercentage: [100],
          emissionReductionAchieved: 20,
        },
      ]),
    };
    (service as any).companyRepo = {
      find: jest.fn().mockResolvedValue([
        { companyId: 10, companyRole: CompanyRole.PROJECT_DEVELOPER, proponentCategory: "Private" },
        { companyId: 11, companyRole: CompanyRole.PROJECT_DEVELOPER, proponentCategory: "Public" },
      ]),
    };
    (service as any).certificateLotRepo = {
      find: jest.fn().mockResolvedValue([
        {
          certificateLotId: "lot-1",
          programmeId: "P-ENERGY",
          registryScheme: "Champa Registry",
          issuedQuantity: "100",
          vintageStart: "2024-01-01",
          vintageEnd: "2024-12-31",
          asOf: new Date("2026-08-05T00:00:00Z"),
          provenance: { dataset_kind: "demo_synthetic", source_type: "synthetic_demo" },
        },
        {
          certificateLotId: "lot-2",
          programmeId: "P-WASTE",
          registryScheme: "Champa Registry",
          issuedQuantity: "50",
          vintageStart: "2025-01-01",
          vintageEnd: "2025-12-31",
          asOf: new Date("2026-08-05T00:00:00Z"),
          provenance: { dataset_kind: "demo_synthetic", source_type: "synthetic_demo" },
        },
      ]),
    };
    (service as any).certificatePortionRepo = {
      find: jest.fn().mockResolvedValue([
        { certificateLotId: "lot-1", state: "AVAILABLE", quantity: "60" },
        { certificateLotId: "lot-1", state: "RETIRED", quantity: "40" },
        { certificateLotId: "lot-2", state: "ASSIGNED_TO_EXCHANGE", quantity: "50" },
      ]),
    };

    const response = await service.getPublicAnalyticsSummary();
    const issuedByScheme = response.data.charts.issued_units_by_registry_scheme.points;
    const issuedBySector = response.data.charts.issued_units_by_sector.points;

    expect(response.meta.dataset_kind).toBe("demo_synthetic");
    expect(response.data.registry_overview.certificate_metrics.issued).toBe(150);
    expect(response.data.registry_overview.certificate_metrics.available).toBe(60);
    expect(response.data.registry_overview.certificate_metrics.retired).toBe(40);
    expect(response.data.registry_overview.certificate_metrics.assigned_to_exchange).toBe(50);
    expect(issuedByScheme.reduce((total, point) => total + point.value, 0)).toBe(150);
    expect(issuedBySector.reduce((total, point) => total + point.value, 0)).toBe(150);
    expect(response.data.charts.issued_units_by_sector.metric.availability).toBe("available");
  });

  it("does not mark a deployment synthetic when it has no synthetic certificate source", async () => {
    const service = Object.create(ProgrammeService.prototype) as ProgrammeService;
    (service as any).getPublicSummary = jest.fn().mockResolvedValue({ stageCounts: {} });
    (service as any).programmeRepo = { find: jest.fn().mockResolvedValue([]) };
    (service as any).companyRepo = { find: jest.fn().mockResolvedValue([]) };
    (service as any).certificateLotRepo = { find: jest.fn().mockResolvedValue([]) };
    (service as any).certificatePortionRepo = { find: jest.fn() };

    const response = await service.getPublicAnalyticsSummary();

    expect(response.meta.dataset_kind).toBe("authoritative");
    expect(response.meta.source.type).toBe("registry_records");
    expect(response.data.charts.issued_units_by_registry_scheme.metric.availability).toBe("not_available");
  });
});
