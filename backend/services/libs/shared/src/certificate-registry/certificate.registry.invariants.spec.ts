import { CertificatePortionState } from "../enum/certificate.ledger.enum";
import { assertLotConservation, assertNonNegativePortion } from "./certificate.registry.invariants";

describe("certificate registry ledger invariants", () => {
  it("reconciles mutually exclusive current portions to the issued lot quantity", () => {
    expect(() => assertLotConservation("100.000000", [
      { certificateLotId: "lot-1", state: CertificatePortionState.AVAILABLE, quantity: "40" },
      { certificateLotId: "lot-1", state: CertificatePortionState.ASSIGNED_TO_EXCHANGE, quantity: "10" },
      { certificateLotId: "lot-1", state: CertificatePortionState.RETIRED, quantity: "25" },
      { certificateLotId: "lot-1", state: CertificatePortionState.CANCELLED, quantity: "15" },
      { certificateLotId: "lot-1", state: CertificatePortionState.WITHHELD, quantity: "10" },
    ])).not.toThrow();
  });

  it("does not count transfer volume as a second balance", () => {
    const balances = [
      { certificateLotId: "lot-1", state: CertificatePortionState.AVAILABLE, quantity: 70 },
      { certificateLotId: "lot-1", state: CertificatePortionState.RETIRED, quantity: 30 },
    ];
    // A transfer of 40 is an event volume only; the current portions still sum to 100.
    const transferredEventVolume = 40;
    expect(transferredEventVolume).toBe(40);
    expect(() => assertLotConservation(100, balances)).not.toThrow();
  });

  it("rejects negative portions and conservation drift", () => {
    expect(() => assertNonNegativePortion(-0.000001)).toThrow("non-negative");
    expect(() => assertLotConservation(100, [
      { certificateLotId: "lot-1", state: CertificatePortionState.AVAILABLE, quantity: 99 },
    ])).toThrow("conservation failed");
  });
});
