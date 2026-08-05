import { CertificatePortionState } from "../enum/certificate.ledger.enum";

export interface PortionBalanceLike {
  certificateLotId: string;
  quantity: number | string;
  state: CertificatePortionState;
}

export function assertNonNegativePortion(quantity: number): void {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error("Certificate portion quantity must be a finite non-negative number");
  }
}

export function assertLotConservation(
  issuedQuantity: number | string,
  portions: PortionBalanceLike[]
): void {
  const issued = Number(issuedQuantity);
  const total = portions.reduce((sum, portion) => {
    const quantity = Number(portion.quantity);
    assertNonNegativePortion(quantity);
    return sum + quantity;
  }, 0);
  if (!Number.isFinite(issued) || Math.abs(issued - total) > 0.000001) {
    throw new Error(`Certificate lot conservation failed: issued=${issued}, portions=${total}`);
  }
}
