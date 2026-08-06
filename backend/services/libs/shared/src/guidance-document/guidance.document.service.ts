import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import { Repository } from "typeorm";
import { GuidanceDocumentEntity } from "../entities/guidance.document.entity";
import { GuidanceDocumentCreateDto } from "../dto/guidance.document.create.dto";
import { GuidanceDocumentUpdateDto } from "../dto/guidance.document.update.dto";
import { GuidanceDocumentStatus } from "../enum/guidance.document.status.enum";

@Injectable()
export class GuidanceDocumentService {
  private readonly logger = new Logger(GuidanceDocumentService.name);

  constructor(
    @InjectRepository(GuidanceDocumentEntity)
    private guidanceDocumentRepo: Repository<GuidanceDocumentEntity>
  ) {}

  async create(
    dto: GuidanceDocumentCreateDto,
    actorId?: number
  ): Promise<GuidanceDocumentEntity> {
    this.assertDocumentUrl(dto.documentUrl);
    this.logger.verbose("Guidance document create received", dto.title);
    const now = Date.now();
    const record = this.guidanceDocumentRepo.create({
      ...dto,
      version: 1,
      status: GuidanceDocumentStatus.PUBLISHED,
      createdBy: actorId,
      updatedBy: actorId,
      updatedAt: now,
      publishedAt: now,
      publishedBy: actorId,
    });
    const saved = await this.guidanceDocumentRepo.save(record);

    // The first insert does not know its generated id. Persisting the group
    // id immediately afterwards makes future updates version against this
    // logical document while remaining compatible with existing seed writes.
    if (!saved.documentGroupId && saved.id) {
      saved.documentGroupId = saved.id;
      return await this.guidanceDocumentRepo.save(saved);
    }
    return saved;
  }

  async findAdminList(
    search = "",
    status?: GuidanceDocumentStatus,
    page = 1,
    pageSize = 25
  ) {
    const records = await this.guidanceDocumentRepo.find({
      order: { createdAt: "DESC", version: "DESC", id: "DESC" },
    });
    const latest = this.latestPerGroup(records);
    const keyword = search.trim().toLowerCase();
    const filtered = latest.filter((record) => {
      const matchesSearch =
        !keyword ||
        [record.title, record.description, record.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesSearch && (!status || this.statusOf(record) === status);
    });

    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    return {
      data: filtered.slice(
        (safePage - 1) * safePageSize,
        safePage * safePageSize
      ),
      total: filtered.length,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async findAdminOne(id: number) {
    const record = await this.findOne(id);
    const groupId = this.groupId(record);
    const versions = (await this.guidanceDocumentRepo.find({
      order: { version: "DESC", id: "DESC" },
    })).filter((candidate) => this.groupId(candidate) === groupId);
    return {
      document: this.latestPerGroup(versions)[0] ?? record,
      versions,
    };
  }

  async update(
    id: number,
    dto: GuidanceDocumentUpdateDto,
    actorId?: number
  ): Promise<GuidanceDocumentEntity> {
    const current = await this.findOne(id);
    this.assertNotArchived(current);
    if (dto.documentUrl !== undefined) {
      this.assertDocumentUrl(dto.documentUrl);
    }

    if (this.statusOf(current) === GuidanceDocumentStatus.PUBLISHED) {
      const versions = await this.findVersions(current);
      const now = Date.now();
      const nextVersion =
        Math.max(...versions.map((version) => version.version || 1), 0) + 1;
      const draft = this.guidanceDocumentRepo.create({
        title: dto.title ?? current.title,
        description: dto.description ?? current.description,
        category: dto.category ?? current.category,
        documentUrl: dto.documentUrl ?? current.documentUrl,
        documentGroupId: this.groupId(current),
        version: nextVersion,
        status: GuidanceDocumentStatus.DRAFT,
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
        updatedBy: actorId,
      });
      return await this.guidanceDocumentRepo.save(draft);
    }

    Object.assign(current, dto, {
      updatedAt: Date.now(),
      updatedBy: actorId,
    });
    return await this.guidanceDocumentRepo.save(current);
  }

  async publish(id: number, actorId?: number): Promise<GuidanceDocumentEntity> {
    const record = await this.findOne(id);
    this.assertNotArchived(record);
    if (this.statusOf(record) === GuidanceDocumentStatus.PUBLISHED) {
      return record;
    }

    const now = Date.now();
    const versions = await this.findVersions(record);
    for (const previous of versions) {
      if (
        previous.id !== record.id &&
        this.statusOf(previous) === GuidanceDocumentStatus.PUBLISHED
      ) {
        previous.status = GuidanceDocumentStatus.ARCHIVED;
        previous.archivedAt = now;
        previous.archivedBy = actorId;
        previous.updatedAt = now;
        previous.updatedBy = actorId;
        await this.guidanceDocumentRepo.save(previous);
      }
    }

    record.documentGroupId = this.groupId(record);
    record.status = GuidanceDocumentStatus.PUBLISHED;
    record.publishedAt = now;
    record.publishedBy = actorId;
    record.updatedAt = now;
    record.updatedBy = actorId;
    return await this.guidanceDocumentRepo.save(record);
  }

  async archive(id: number, actorId?: number): Promise<GuidanceDocumentEntity> {
    const record = await this.findOne(id);
    if (this.statusOf(record) === GuidanceDocumentStatus.ARCHIVED) {
      return record;
    }

    const now = Date.now();
    record.status = GuidanceDocumentStatus.ARCHIVED;
    record.archivedAt = now;
    record.archivedBy = actorId;
    record.updatedAt = now;
    record.updatedBy = actorId;
    return await this.guidanceDocumentRepo.save(record);
  }

  // Public, unauthenticated list of guidance documents for the Instruments
  // > Module directory. Only the latest published version per logical
  // document is exposed; archived files remain in the database.
  async getPublicList(
    search = "",
    category?: string,
    page = 1,
    pageSize = 10,
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    meta: Record<string, unknown>;
  }> {
    const documents = await this.guidanceDocumentRepo.find({
      order: { createdAt: "DESC", version: "DESC", id: "DESC" },
    });

    const keyword = search.trim().toLowerCase();
    const filtered = this.latestPerGroup(
      documents.filter(
        (doc) =>
          this.statusOf(doc) === GuidanceDocumentStatus.PUBLISHED &&
          !doc.archivedAt
      )
    )
      .filter(
        (doc) =>
          !keyword ||
          [doc.title, doc.description, doc.category]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
      )
      .filter((doc) => !category || doc.category === category)
      .sort(
        (a, b) =>
          (Number(a.createdAt) - Number(b.createdAt)) *
          (sortOrder === "desc" ? -1 : 1)
      );

    const safePage = Math.max(1, page);
    const safePageSize = Math.min(50, Math.max(1, pageSize));
    return {
      data: filtered
        .slice((safePage - 1) * safePageSize, safePage * safePageSize)
        .map((doc) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          category: doc.category,
          documentUrl: doc.documentUrl,
          createdAt: doc.createdAt,
          documentType: this.getDocumentType(doc.documentUrl),
          sizeBytes: this.getDocumentSize(doc.documentUrl),
          contentHash: createHash("sha256")
            .update(doc.documentUrl || `document:${doc.id}`)
            .digest("hex"),
          version: doc.version || 1,
          publicationStatus: this.statusOf(doc),
        })),
      total: filtered.length,
      page: safePage,
      pageSize: safePageSize,
      meta: {
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        scenario: "Champa registry demonstration",
        availability: filtered.length ? "available" : "empty",
        categories: [
          ...new Set(filtered.map((document) => document.category).filter(Boolean)),
        ],
        disclosure:
          "Synthetic demonstration data, not official Lao PDR guidance records.",
      },
    };
  }

  private async findOne(id: number): Promise<GuidanceDocumentEntity> {
    const record = await this.guidanceDocumentRepo.findOneBy({ id });
    if (!record) {
      throw new NotFoundException("Guidance document not found");
    }
    return record;
  }

  private async findVersions(record: GuidanceDocumentEntity) {
    const groupId = this.groupId(record);
    const records = await this.guidanceDocumentRepo.find({
      order: { version: "DESC", id: "DESC" },
    });
    return records.filter((candidate) => this.groupId(candidate) === groupId);
  }

  private latestPerGroup(records: GuidanceDocumentEntity[]) {
    const latest = new Map<number, GuidanceDocumentEntity>();
    for (const record of records) {
      const groupId = this.groupId(record);
      const current = latest.get(groupId);
      if (
        !current ||
        (record.version || 1) > (current.version || 1) ||
        ((record.version || 1) === (current.version || 1) &&
          Number(record.id) > Number(current.id))
      ) {
        latest.set(groupId, record);
      }
    }
    return [...latest.values()];
  }

  private groupId(record: GuidanceDocumentEntity) {
    return record.documentGroupId || record.id;
  }

  private statusOf(record: GuidanceDocumentEntity) {
    // Existing imported/demo rows predate the lifecycle column. They remain
    // public until explicitly archived, preserving the current seed contract.
    return record.status ?? GuidanceDocumentStatus.PUBLISHED;
  }

  private assertNotArchived(record: GuidanceDocumentEntity) {
    if (this.statusOf(record) === GuidanceDocumentStatus.ARCHIVED) {
      throw new BadRequestException(
        "Archived guidance versions are retained and cannot be edited."
      );
    }
  }

  private assertDocumentUrl(documentUrl: string) {
    if (!documentUrl || !/^(https?:\/\/|data:[^;]+;base64,)/i.test(documentUrl)) {
      throw new BadRequestException(
        "documentUrl must be an HTTP(S) URL or a base64 data URI."
      );
    }
  }

  private getDocumentType(documentUrl: string | null | undefined) {
    if (!documentUrl) return null;
    if (documentUrl.startsWith("data:application/pdf")) return "PDF";
    return documentUrl.split(/[?#]/)[0].split(".").pop()?.toUpperCase() || "FILE";
  }

  private getDocumentSize(documentUrl: string | null | undefined) {
    if (!documentUrl) return null;
    const base64 = documentUrl.match(/^data:[^;]+;base64,(.*)$/)?.[1];
    return base64 ? Math.floor((base64.length * 3) / 4) : null;
  }
}
