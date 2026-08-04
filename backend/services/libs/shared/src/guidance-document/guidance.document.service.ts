import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GuidanceDocumentEntity } from "../entities/guidance.document.entity";
import { GuidanceDocumentCreateDto } from "../dto/guidance.document.create.dto";

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
  async getPublicList(): Promise<
    {
      id: number;
      title: string;
      description: string;
      category: string;
      documentUrl: string;
      createdAt: number;
    }[]
  > {
    const documents = await this.guidanceDocumentRepo.find({
      order: { createdAt: "DESC" },
    });

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      documentUrl: doc.documentUrl,
      createdAt: doc.createdAt,
    }));
  }
}
