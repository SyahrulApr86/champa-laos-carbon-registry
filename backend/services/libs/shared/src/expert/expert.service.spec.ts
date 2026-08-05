import { BadRequestException } from "@nestjs/common";
import { ExpertService } from "./expert.service";
import { ExpertStatus } from "../enum/expert.status.enum";

describe("ExpertService management lifecycle", () => {
  const records: any[] = [
    {
      id: 1,
      name: "A. Expert",
      affiliation: "DNA Lab",
      expertise: "MRV",
      certification: "Certified",
      yearsOfExperience: 12,
      province: "Vientiane Capital",
      status: ExpertStatus.ACTIVE,
      archivedAt: null,
    },
  ];

  const buildService = () => {
    const repo: any = {
      findOneBy: jest.fn(async ({ id }) => records.find((row) => row.id === id)),
      find: jest.fn(async () => records),
      save: jest.fn(async (row) => row),
      create: jest.fn((row) => ({ ...row, id: row.id ?? 2 })),
      createQueryBuilder: jest.fn(() => {
        const query: any = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn(async () => {
            const publicRows = records.filter(
              (row) => row.status === ExpertStatus.ACTIVE && !row.archivedAt
            );
            return [publicRows, publicRows.length];
          }),
        };
        return query;
      }),
    };
    const regionRepo: any = {
      findOneBy: jest.fn(async () => ({ regionName: "Vientiane Capital" })),
    };
    return { service: new ExpertService(repo, regionRepo), repo, regionRepo };
  };

  it("hides a status change and archive from the public roster", async () => {
    const { service } = buildService();

    await service.updateStatus(1, { status: ExpertStatus.INACTIVE });
    expect((await service.publicSearch("", 1, 10)).total).toBe(0);

    records[0].status = ExpertStatus.ACTIVE;
    await service.archive(1, 42);
    expect((await service.publicSearch("", 1, 10)).total).toBe(0);
    expect(records[0].archivedBy).toBe(42);
  });

  it("validates the province against the configured region table", async () => {
    const { service, regionRepo } = buildService();
    regionRepo.findOneBy.mockResolvedValueOnce(null);

    await expect(
      service.create({
        name: "Invalid Province Expert",
        affiliation: "DNA Lab",
        expertise: "MRV",
        province: "Not a Lao province",
        yearsOfExperience: 10,
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
