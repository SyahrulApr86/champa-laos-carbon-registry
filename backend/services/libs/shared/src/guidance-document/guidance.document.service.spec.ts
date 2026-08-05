import { BadRequestException } from "@nestjs/common";
import { GuidanceDocumentService } from "./guidance.document.service";
import { GuidanceDocumentStatus } from "../enum/guidance.document.status.enum";

describe("GuidanceDocumentService version lifecycle", () => {
  const buildService = () => {
    const records: any[] = [];
    let nextId = 1;
    const repo: any = {
      create: jest.fn((row) => ({
        ...row,
        id: row.id ?? nextId++,
        createdAt: row.createdAt ?? Date.now(),
      })),
      save: jest.fn(async (row) => {
        const index = records.findIndex((candidate) => candidate.id === row.id);
        if (index === -1) records.push(row);
        else records[index] = row;
        return row;
      }),
      find: jest.fn(async () => records),
      findOneBy: jest.fn(async ({ id }) =>
        records.find((candidate) => candidate.id === id)
      ),
    };
    return { service: new GuidanceDocumentService(repo), records, repo };
  };

  it("keeps the published version public while an edit is a draft, then refreshes on publish", async () => {
    const { service, records } = buildService();
    const first = await service.create({
      title: "Guidance v1",
      description: "First version",
      category: "Guideline",
      documentUrl: "https://example.test/guidance-v1.pdf",
    } as any);

    expect((await service.getPublicList()).data[0].version).toBe(1);

    const draft = await service.update(first.id, {
      title: "Guidance v2",
      documentUrl: "https://example.test/guidance-v2.pdf",
    });
    expect(draft.status).toBe(GuidanceDocumentStatus.DRAFT);
    expect((await service.getPublicList()).data[0].title).toBe("Guidance v1");
    expect(records).toHaveLength(2);

    await service.publish(draft.id, 7);
    const publicList = await service.getPublicList();
    expect(publicList.data[0].title).toBe("Guidance v2");
    expect(publicList.data[0].version).toBe(2);
    expect(records.find((row) => row.id === first.id).status).toBe(
      GuidanceDocumentStatus.ARCHIVED
    );
    expect(records.find((row) => row.id === first.id).documentUrl).toContain(
      "v1"
    );
  });

  it("rejects unsafe document URLs before persistence", async () => {
    const { service, repo } = buildService();

    await expect(
      service.create({
        title: "Unsafe",
        documentUrl: "javascript:alert(1)",
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
