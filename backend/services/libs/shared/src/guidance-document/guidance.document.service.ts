import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GuidanceDocumentEntity } from "../entities/guidance.document.entity";
import { GuidanceDocumentCreateDto } from "../dto/guidance.document.create.dto";
import { createHash } from "crypto";

@Injectable()
export class GuidanceDocumentService {
  private readonly logger = new Logger(GuidanceDocumentService.name);

  constructor(
    @InjectRepository(GuidanceDocumentEntity)
    private guidanceDocumentRepo: Repository<GuidanceDocumentEntity>
  ) {}

  async create(dto: GuidanceDocumentCreateDto): Promise<GuidanceDocumentEntity> {
    this.logger.verbose("Guidance document create received", dto.title);
    const record = this.guidanceDocumentRepo.create(dto);
    return await this.guidanceDocumentRepo.save(record);
  }

  // Public, unauthenticated list of guidance documents for the Instruments
  // > Module directory. Newest first.
  async getPublicList(
    search = "",
    category?: string,
    page = 1,
    pageSize = 10,
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<{ data: any[]; total: number; page: number; pageSize: number; meta: Record<string, unknown> }> {
    const documents = await this.guidanceDocumentRepo.find({
      order: { createdAt: "DESC" },
    });

    const keyword = search.trim().toLowerCase();
    const filtered = documents
      .filter((doc) =>
        !keyword || [doc.title, doc.description, doc.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      )
      .filter((doc) => !category || doc.category === category)
      .sort((a, b) => (Number(a.createdAt) - Number(b.createdAt)) * (sortOrder === "desc" ? -1 : 1));

    const safePage = Math.max(1, page);
    const safePageSize = Math.min(50, Math.max(1, pageSize));
    return {
      data: filtered.slice((safePage - 1) * safePageSize, safePage * safePageSize).map((doc) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        documentUrl: doc.documentUrl,
        createdAt: doc.createdAt,
        documentType: this.getDocumentType(doc.documentUrl),
        sizeBytes: this.getDocumentSize(doc.documentUrl),
        contentHash: createHash("sha256").update(doc.documentUrl || `document:${doc.id}`).digest("hex"),
        version: null,
        publicationStatus: "synthetic_demo",
      })),
      total: filtered.length,
      page: safePage,
      pageSize: safePageSize,
      meta: {
        dataset_kind: "demo_synthetic",
        source_type: "synthetic_demo",
        scenario: "Champa registry demonstration",
        availability: filtered.length ? "available" : "empty",
        disclosure: "Synthetic demonstration data — not official Lao PDR guidance records.",
      },
    };
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
