import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClimateFinanceEntity } from "../entities/climate.finance.entity";
import { ClimateFinanceCreateDto } from "../dto/climate.finance.create.dto";
import { ClimateFinanceUpdateDto } from "../dto/climate.finance.update.dto";
import {
  createPublicMeta,
  PublicListResponse,
} from "../public-data/public.data.contract";

export interface ClimateFinancePublicRow {
  recordId: string;
  title: string;
  description: string;
  channel: string;
  recipientEntity: string;
  implementingEntity: string;
  dateSigned: number;
  dateClosing: number | null;
  amountLAK: number | null;
  amountUSD: number | null;
  sector: string;
  financialInstrument: string;
  status: string;
  type: string;
  createdAt: number;
}

export interface ClimateFinanceManagementOptions {
  q?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ClimateFinanceService {
  private readonly logger = new Logger(ClimateFinanceService.name);

  constructor(
    @InjectRepository(ClimateFinanceEntity)
    private climateFinanceRepo: Repository<ClimateFinanceEntity>
  ) {}

  async create(dto: ClimateFinanceCreateDto): Promise<ClimateFinanceEntity> {
    this.logger.verbose("Climate finance record create received", dto.title);
    const record = this.climateFinanceRepo.create(dto);
    return await this.climateFinanceRepo.save(record);
  }

  async managementList(
    options: ClimateFinanceManagementOptions = {}
  ): Promise<PublicListResponse<ClimateFinanceEntity>> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 25));
    const keyword = (options.q || "").trim().toLowerCase();
    const records = await this.climateFinanceRepo.find({
      order: { createdAt: "DESC" },
    });
    const filtered = records.filter(
      (record) =>
        (options.includeArchived || record.archivedAt == null) &&
        (!keyword ||
          `${record.title} ${record.recipientEntity} ${record.implementingEntity}`
            .toLowerCase()
            .includes(keyword))
    );

    return {
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: createPublicMeta(
        {
          q: options.q || null,
          includeArchived: options.includeArchived ? "true" : "false",
        },
        {
          pagination: {
            page,
            page_size: pageSize,
            total_items: filtered.length,
          },
        }
      ),
    };
  }

  async managementDetail(id: number): Promise<ClimateFinanceEntity> {
    const record = await this.climateFinanceRepo.findOneBy({ id });
    if (!record) {
      throw new HttpException(
        "Climate finance record not found",
        HttpStatus.NOT_FOUND
      );
    }
    return record;
  }

  async update(
    id: number,
    dto: ClimateFinanceUpdateDto
  ): Promise<ClimateFinanceEntity> {
    const record = await this.managementDetail(id);
    if (record.archivedAt != null) {
      throw new HttpException(
        "Archived climate finance records cannot be edited",
        HttpStatus.CONFLICT
      );
    }
    Object.assign(record, dto, { updatedAt: Date.now() });
    return await this.climateFinanceRepo.save(record);
  }

  async archive(id: number, reason?: string): Promise<ClimateFinanceEntity> {
    const record = await this.managementDetail(id);
    Object.assign(record, {
      archivedAt: Date.now(),
      archiveReason: reason || null,
      updatedAt: Date.now(),
    });
    return await this.climateFinanceRepo.save(record);
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    await this.managementDetail(id);
    await this.climateFinanceRepo.delete(id);
    return { id, deleted: true };
  }

  // Public, unauthenticated search. This data is intentionally fully public
  // (mirrors SRN's public "Financial Support Received" table), so all fields
  // are returned, unlike other publicSearch endpoints in this codebase.
  async publicSearch(
    q: string,
    page = 1,
    size = 10,
    filters: { sector?: string; channel?: string; status?: string } = {}
  ): Promise<PublicListResponse<ClimateFinancePublicRow>> {
    const keyword = (q || "").trim();
    const safePage = Math.max(1, page);
    const safeSize = Math.min(50, Math.max(1, size));

    let qb = this.climateFinanceRepo
      .createQueryBuilder("finance")
      .where(`"finance"."archivedAt" IS NULL`)
      .orderBy(`"finance"."dateSigned"`, "DESC")
      .skip((safePage - 1) * safeSize)
      .take(safeSize);

    if (keyword) {
      qb = qb.andWhere(
        `("finance"."title" ILIKE :keyword OR "finance"."recipientEntity" ILIKE :keyword OR "finance"."implementingEntity" ILIKE :keyword)`,
        { keyword: `%${keyword}%` }
      );
    }
    if (filters.sector) {
      qb = qb.andWhere(`"finance"."sector" = :sector`, {
        sector: filters.sector,
      });
    }
    if (filters.channel) {
      qb = qb.andWhere(`"finance"."channel" = :channel`, {
        channel: filters.channel,
      });
    }
    if (filters.status) {
      qb = qb.andWhere(`"finance"."status" = :status`, {
        status: filters.status,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((record) => this.toPublicRow(record)),
      meta: createPublicMeta(
        {
          q: q || null,
          sector: filters.sector || null,
          channel: filters.channel || null,
          status: filters.status || null,
        },
        {
          pagination: {
            page: safePage,
            page_size: safeSize,
            total_items: total,
          },
        }
      ),
    };
  }

  async publicSummary(): Promise<{
    data: {
      totalAmountLAK: number | null;
      totalAmountUSD: number | null;
      bySector: Record<string, number>;
      bySectorLAK: Record<string, number>;
      bySectorUSD: Record<string, number>;
      byChannel: Record<string, { amount: number; percentage: number | null }>;
      byChannelLAK: Record<
        string,
        { amount: number; percentage: number | null }
      >;
      byChannelUSD: Record<
        string,
        { amount: number; percentage: number | null }
      >;
      currencyAvailability: {
        LAK: "available" | "not_available";
        USD: "available" | "not_available";
      };
    };
    meta: ReturnType<typeof createPublicMeta>;
  }> {
    const records = (await this.climateFinanceRepo.find()).filter(
      (record) => record.archivedAt == null
    );

    let totalAmountLAK = 0;
    let totalAmountUSD = 0;
    // Legacy combined field (LAK-only despite the generic name; kept for
    // backward compatibility with any existing consumers).
    const bySector: Record<string, number> = {};
    // Currency-specific splits, additive: sum only the actual amountLAK /
    // amountUSD values entered per record, never derived/converted.
    const bySectorUSD: Record<string, number> = {};
    const byChannelAmountLAK: Record<string, number> = {};
    const byChannelAmountUSD: Record<string, number> = {};
    let hasLAK = false;
    let hasUSD = false;

    for (const record of records) {
      const lak = record.amountLAK == null ? null : Number(record.amountLAK);
      const usd = record.amountUSD == null ? null : Number(record.amountUSD);
      if (lak !== null) {
        hasLAK = true;
        totalAmountLAK += lak;
        bySector[record.sector] = (bySector[record.sector] || 0) + lak;
        byChannelAmountLAK[record.channel] =
          (byChannelAmountLAK[record.channel] || 0) + lak;
      }
      if (usd !== null) {
        hasUSD = true;
        totalAmountUSD += usd;
        bySectorUSD[record.sector] = (bySectorUSD[record.sector] || 0) + usd;
        byChannelAmountUSD[record.channel] =
          (byChannelAmountUSD[record.channel] || 0) + usd;
      }
    }

    const toChannelBreakdown = (
      amounts: Record<string, number>,
      total: number
    ) =>
      Object.fromEntries(
        Object.entries(amounts).map(([channel, amount]) => [
          channel,
          {
            amount,
            percentage: total > 0 ? (amount / total) * 100 : null,
          },
        ])
      ) as Record<string, { amount: number; percentage: number | null }>;
    const byChannelLAK = toChannelBreakdown(byChannelAmountLAK, totalAmountLAK);
    const byChannelUSD = toChannelBreakdown(byChannelAmountUSD, totalAmountUSD);

    return {
      data: {
        totalAmountLAK: hasLAK ? totalAmountLAK : null,
        totalAmountUSD: hasUSD ? totalAmountUSD : null,
        bySector,
        bySectorLAK: bySector,
        bySectorUSD,
        byChannel: byChannelLAK,
        byChannelLAK,
        byChannelUSD,
        currencyAvailability: {
          LAK: hasLAK ? "available" : "not_available",
          USD: hasUSD ? "available" : "not_available",
        },
      },
      meta: createPublicMeta(
        {},
        {
          unit: "currency amount",
          pagination: { total_items: records.length },
        }
      ),
    };
  }

  private toPublicRow(record: ClimateFinanceEntity): ClimateFinancePublicRow {
    return {
      recordId: String(record.id),
      title: record.title,
      description: record.description,
      channel: record.channel,
      recipientEntity: record.recipientEntity,
      implementingEntity: record.implementingEntity,
      dateSigned: record.dateSigned,
      dateClosing: record.dateClosing ?? null,
      amountLAK: record.amountLAK == null ? null : Number(record.amountLAK),
      amountUSD: record.amountUSD == null ? null : Number(record.amountUSD),
      sector: record.sector,
      financialInstrument: record.financialInstrument,
      status: record.status,
      type: record.type,
      createdAt: record.createdAt,
    };
  }
}
