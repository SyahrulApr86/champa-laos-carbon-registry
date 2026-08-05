import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CertificateRegistryService } from "@app/shared/certificate-registry/certificate.registry.service";
import { CertificateLedgerEvent } from "@app/shared/entities/certificate.ledger.event.entity";
import { CertificateLot } from "@app/shared/entities/certificate.lot.entity";
import { CertificatePortion } from "@app/shared/entities/certificate.portion.entity";
import { CertificateLedgerEventType } from "@app/shared/enum/certificate.ledger.enum";
import {
  DEMO_MINIMUMS,
  DEMO_SCENARIO,
  DemoSeedLoadResult,
  DemoSeedScenario,
  W2SeedLoader,
} from "./scenario";

const LOT_PREFIX = "champa-demo-cert-lot-";
const CERTIFICATE_PREFIX = "CHAMPA-DEMO-CERT-";
const ISSUED_QUANTITY = 1000;

type AppliedLot = Pick<
  CertificateLot,
  "certificateLotId" | "provenance" | "issuedQuantity"
>;

/**
 * Persists only the synthetic certificate scenario. The scenario ID and hash
 * live in existing lot provenance, so this loader does not add application
 * schema or take ownership of non-demo registry records.
 */
@Injectable()
export class CanonicalCertificateDemoLoader implements W2SeedLoader {
  constructor(
    @InjectRepository(CertificateLot)
    private readonly lotRepo: Repository<CertificateLot>,
    @InjectRepository(CertificatePortion)
    private readonly portionRepo: Repository<CertificatePortion>,
    @InjectRepository(CertificateLedgerEvent)
    private readonly eventRepo: Repository<CertificateLedgerEvent>,
    private readonly certificateRegistry: CertificateRegistryService,
  ) {}

  async load(scenario: DemoSeedScenario): Promise<DemoSeedLoadResult> {
    const existing = await this.getAppliedScenarioHash(scenario.version);
    if (existing === scenario.hash)
      return { status: "unchanged", hash: scenario.hash };
    await this.replaceSyntheticScenario(scenario);
    const applied = await this.getAppliedScenarioHash(scenario.version);
    if (applied !== scenario.hash)
      throw new Error(
        `Canonical certificate scenario did not converge for ${scenario.version}`,
      );
    return { status: "loaded", hash: scenario.hash };
  }

  async getAppliedScenarioHash(scenarioId: string): Promise<string | null> {
    const lots = await this.scenarioLots(scenarioId);
    if (lots.length !== DEMO_MINIMUMS.certificateLots) return null;
    const hash = String(lots[0]?.provenance?.scenario_hash ?? "");
    if (!hash || lots.some((lot) => lot.provenance?.scenario_hash !== hash))
      return null;

    const lotIds = lots.map((lot) => lot.certificateLotId);
    const [events, portions] = await Promise.all([
      this.eventRepo.findBy({ certificateLotId: In(lotIds) }),
      this.portionRepo.findBy({ certificateLotId: In(lotIds) }),
    ]);
    if (events.length !== DEMO_MINIMUMS.ledgerEvents) return null;
    for (const lot of lots) {
      const balance = portions
        .filter((portion) => portion.certificateLotId === lot.certificateLotId)
        .reduce((sum, portion) => sum + Number(portion.quantity), 0);
      if (Math.abs(balance - Number(lot.issuedQuantity)) > 0.000001)
        return null;
    }
    return hash;
  }

  async replaceSyntheticScenario(scenario: DemoSeedScenario): Promise<void> {
    const previous = await this.scenarioLots(scenario.version);
    const previousIds = previous.map((lot) => lot.certificateLotId);
    if (previousIds.length) {
      await this.eventRepo.delete({ certificateLotId: In(previousIds) });
      await this.portionRepo.delete({ certificateLotId: In(previousIds) });
      await this.lotRepo.delete({ certificateLotId: In(previousIds) });
    }

    const lotRecords = scenario.records.filter(
      (record) => record.kind === "certificateLots",
    );
    const eventRecords = scenario.records.filter(
      (record) => record.kind === "ledgerEvents",
    );
    if (
      lotRecords.length !== DEMO_MINIMUMS.certificateLots ||
      eventRecords.length !== DEMO_MINIMUMS.ledgerEvents
    ) {
      throw new Error(
        "Demo scenario does not contain the expected canonical certificate counts",
      );
    }

    const asOf = new Date(DEMO_SCENARIO.asOf);
    await this.lotRepo.save(
      lotRecords.map((record) =>
        this.lotFor(record.ordinal, record.year, asOf, scenario),
      ),
    );

    let eventIndex = 0;
    for (const lotRecord of lotRecords) {
      const lotId = this.lotId(lotRecord.ordinal);
      const issued = await this.record(
        eventRecords[eventIndex++],
        lotId,
        CertificateLedgerEventType.ISSUED,
        ISSUED_QUANTITY,
        undefined,
        "1",
      );
      const sourcePortionId = `${issued.eventId}:portion`;

      if (lotRecord.ordinal <= 560) {
        const transferred = await this.record(
          eventRecords[eventIndex++],
          lotId,
          CertificateLedgerEventType.TRANSFERRED,
          120,
          sourcePortionId,
          String((lotRecord.ordinal % 20) + 1),
        );
        const terminalTypes = [
          CertificateLedgerEventType.RETIRED,
          CertificateLedgerEventType.CANCELLED,
          CertificateLedgerEventType.ASSIGNED_TO_EXCHANGE,
          CertificateLedgerEventType.WITHHELD,
        ];
        await this.record(
          eventRecords[eventIndex++],
          lotId,
          terminalTypes[(lotRecord.ordinal - 1) % terminalTypes.length],
          60,
          `${transferred.eventId}:portion`,
        );
      } else {
        const types = [
          CertificateLedgerEventType.RETIRED,
          CertificateLedgerEventType.CANCELLED,
          CertificateLedgerEventType.ASSIGNED_TO_EXCHANGE,
          CertificateLedgerEventType.WITHHELD,
          CertificateLedgerEventType.TRANSFERRED,
        ];
        const type = types[(lotRecord.ordinal - 1) % types.length];
        await this.record(
          eventRecords[eventIndex++],
          lotId,
          type,
          80,
          sourcePortionId,
          type === CertificateLedgerEventType.TRANSFERRED
            ? String((lotRecord.ordinal % 20) + 1)
            : undefined,
        );
      }
    }
    if (eventIndex !== DEMO_MINIMUMS.ledgerEvents)
      throw new Error(
        "Canonical certificate event plan does not match scenario count",
      );
  }

  private async scenarioLots(scenarioId: string): Promise<AppliedLot[]> {
    const lots = await this.lotRepo.find();
    return lots.filter(
      (lot) =>
        lot.certificateLotId.startsWith(LOT_PREFIX) &&
        lot.provenance?.scenario_id === scenarioId,
    );
  }

  private lotFor(
    ordinal: number,
    year: number,
    asOf: Date,
    scenario: DemoSeedScenario,
  ): CertificateLot {
    return this.lotRepo.create({
      certificateLotId: this.lotId(ordinal),
      programmeId: `champa-demo-programme-${String(((ordinal - 1) % 240) + 1).padStart(4, "0")}`,
      certificateId: `${CERTIFICATE_PREFIX}${String(ordinal).padStart(4, "0")}`,
      registryScheme: "Champa synthetic demonstration registry",
      registryNumber: `DEMO-${year}-${String(ordinal).padStart(4, "0")}`,
      serialNumber: `SYN-${year}-${String(ordinal).padStart(6, "0")}`,
      vintageStart: `${year}-01-01`,
      vintageEnd: `${year}-12-31`,
      issuedQuantity: ISSUED_QUANTITY.toFixed(6),
      unit: "tCO2e",
      issuedAt: asOf,
      asOf,
      provenance: {
        scenario_id: scenario.version,
        scenario_hash: scenario.hash,
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        source_label: DEMO_SCENARIO.sourceLabel,
        methodology_version: DEMO_SCENARIO.methodologyVersion,
        disclosure: scenario.disclosure,
      },
      publicFields: {
        disclosure: scenario.disclosure,
        availability: "available",
      },
    });
  }

  private record(
    record: DemoSeedScenario["records"][number],
    lotId: string,
    eventType: CertificateLedgerEventType,
    quantity: number,
    sourcePortionId?: string,
    toOwnerCompanyId?: string,
  ) {
    return this.certificateRegistry.recordEvent({
      idempotencyKey: `champa-demo:${record.record_id}`,
      certificateLotId: lotId,
      eventType,
      quantity,
      sourcePortionId,
      toOwnerCompanyId,
      actorReference: "synthetic_demo_loader",
      reason:
        eventType === CertificateLedgerEventType.WITHHELD
          ? "Synthetic demonstration withholding"
          : undefined,
      effectiveAt: `${record.year}-06-30T00:00:00.000Z`,
    });
  }

  private lotId(ordinal: number): string {
    return `${LOT_PREFIX}${String(ordinal).padStart(4, "0")}`;
  }
}
