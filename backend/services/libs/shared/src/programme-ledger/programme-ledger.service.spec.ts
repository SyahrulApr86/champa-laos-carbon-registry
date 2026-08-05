import { HttpStatus } from "@nestjs/common";
import { ProgrammeLedgerService } from "./programme-ledger.service";
import { OrganisationCreditAccounts } from "../enum/organisation.credit.accounts.enum";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { TxType } from "../enum/txtype.enum";

const helperService = {
  halfUpToPrecision: (value: number, precision = 2) =>
    Number(Number(value).toFixed(precision)),
  formatReqMessagesString: (key: string) => key,
};

const programme = {
  programmeId: "P-001",
  serialNo: "LA-001",
  currentStage: ProgrammeStage.AUTHORISED,
  companyId: [10],
  creditOwnerPercentage: [100],
  creditFrozen: [0],
  creditBalance: 100,
  creditCancelled: [],
  creditAssignedToExchange: [],
  txTime: 1,
};

function runTransition(action: TxType.CANCEL | TxType.ASSIGN_TO_EXCHANGE) {
  const service = Object.create(
    ProgrammeLedgerService.prototype
  ) as ProgrammeLedgerService;
  const ledger = {
    tableName: "programmeLedger",
    companyTableName: "companyLedger",
    getAndUpdateTx: jest.fn(async (_queries, process) => {
      const [update, updateWhere, insert] = process({
        programmeLedger: [programme],
        companyLedger: [
          { txId: "10", credit: 100 },
          ...(action === TxType.ASSIGN_TO_EXCHANGE
            ? []
            : [{ txId: `10#${OrganisationCreditAccounts.EXCHANGE}`, credit: 0 }]),
        ],
      });
      (service as any).transition = { update, updateWhere, insert };
      return { programmeLedger: [0] };
    }),
  };
  (service as any).ledger = ledger;
  (service as any).helperService = helperService;
  return { service, ledger };
}

describe("ProgrammeLedgerService credit state transitions", () => {
  it("writes cancellation to the programme and owner ledger", async () => {
    const { service, ledger } = runTransition(TxType.CANCEL);

    const updated = await service.applyProgrammeCreditStatus(
      "P-001",
      [{ companyId: 10, amount: 25 }],
      TxType.CANCEL,
      "cancel#P-001"
    );

    expect(ledger.getAndUpdateTx).toHaveBeenCalled();
    expect((service as any).transition.update.programmeLedger).toMatchObject({
      creditBalance: 75,
      creditCancelled: [25],
      txType: TxType.CANCEL,
    });
    expect(
      (service as any).transition.update["companyLedger#10"]
    ).toMatchObject({ credit: 75, txType: TxType.CANCEL });
    expect(updated.creditBalance).toBe(75);
  });

  it("moves assignment credits into the exchange secondary account", async () => {
    const { service } = runTransition(TxType.ASSIGN_TO_EXCHANGE);

    await service.applyProgrammeCreditStatus(
      "P-001",
      [{ companyId: 10, amount: 25 }],
      TxType.ASSIGN_TO_EXCHANGE,
      "exchange#P-001"
    );

    expect(
      (service as any).transition.insert[
        `companyLedger#10#${OrganisationCreditAccounts.EXCHANGE}`
      ]
    ).toMatchObject({
      credit: 25,
      txType: TxType.ASSIGN_TO_EXCHANGE,
      txId: `10#${OrganisationCreditAccounts.EXCHANGE}`,
    });
    expect(
      (service as any).transition.update.programmeLedger
    ).toMatchObject({
      creditBalance: 75,
      creditAssignedToExchange: [25],
      txType: TxType.ASSIGN_TO_EXCHANGE,
    });
  });

  it("rejects an unauthorised programme transition", async () => {
    const { service } = runTransition(TxType.CANCEL);
    (service as any).ledger.getAndUpdateTx.mockImplementationOnce(
      async (_queries, process) => {
        return process({
          programmeLedger: [
            { ...programme, currentStage: ProgrammeStage.APPROVED },
          ],
          companyLedger: [{ txId: "10", credit: 100 }],
        });
      }
    );

    await expect(
      service.applyProgrammeCreditStatus(
        "P-001",
        [{ companyId: 10, amount: 25 }],
        TxType.CANCEL,
        "cancel#P-001"
      )
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });
});
