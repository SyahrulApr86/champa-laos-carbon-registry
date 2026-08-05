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
