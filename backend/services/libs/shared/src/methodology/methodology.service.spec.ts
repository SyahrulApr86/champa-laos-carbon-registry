import { validate } from "class-validator";
import { MethodologyCreateDto } from "../dto/methodology.create.dto";
import {
  MethodologyLifecycleAction,
  MethodologyLifecycleDto,
} from "../dto/methodology.lifecycle.dto";
import { MethodologyEntity } from "../entities/methodology.entity";
import { MethodologyStatus } from "../enum/methodology.status.enum";
import { Sector } from "../enum/sector.enum";
import { MethodologyService } from "./methodology.service";

describe("MethodologyService management lifecycle", () => {
  const records = [
    {
      id: 1,
      methodologyNumber: "METH-001",
      name: "Active method",
      source: "DNA",
      category: Sector.Energy,
      status: MethodologyStatus.ACTIVE,
      description: "Active record",
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 2,
      methodologyNumber: "METH-002",
      name: "Archived method",
      source: "DNA",
      category: Sector.Energy,
      status: MethodologyStatus.INACTIVE,
      description: "Archived record",
      createdAt: 2,
      updatedAt: 2,
    },
  ] as MethodologyEntity[];

  const createService = () => {
    let statusFilter: MethodologyStatus | undefined;
    const queryBuilder = {
      andWhere: jest.fn(
        (_: string, params?: { status?: MethodologyStatus }) => {
          if (params?.status) statusFilter = params.status;
          return queryBuilder;
        }
      ),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(async () => {
        const data = records.filter(
          (record) => !statusFilter || record.status === statusFilter
        );
        return [data, data.length] as [MethodologyEntity[], number];
      }),
    };
    const repository = {
      createQueryBuilder: jest.fn(() => {
        statusFilter = undefined;
        return queryBuilder;
      }),
      findOneBy: jest.fn(async ({ id }: { id: number }) =>
        records.find((record) => record.id === id)
      ),
      save: jest.fn(async (record: MethodologyEntity) => record),
      create: jest.fn((record: Partial<MethodologyEntity>) => record),
    };
    return {
      service: new MethodologyService(repository as any),
      repository,
      queryBuilder,
    };
  };

  it("refreshes the public directory after an archive without deleting the row", async () => {
    const { service, repository } = createService();

    const before = await service.findPublic();
    expect(before.total).toBe(1);
    expect(before.data[0].id).toBe(1);

    await service.archive(1, { id: 42 });

    const after = await service.findPublic();
    expect(after.total).toBe(0);
    expect(repository.save).toHaveBeenCalled();
    expect((repository as any).delete).toBeUndefined();
    expect(records[0].status).toBe(MethodologyStatus.INACTIVE);
  });

  it("publishes an archived record and clears archive audit fields", async () => {
    const { service } = createService();
    records[1].archivedAt = 10;
    records[1].archivedBy = 7;

    const result = await service.transition(
      2,
      { action: MethodologyLifecycleAction.PUBLISH },
      { id: 42 }
    );

    expect(result.status).toBe(MethodologyStatus.ACTIVE);
    expect(result.archivedAt).toBeNull();
    expect(result.archivedBy).toBeNull();
    expect(result.updatedBy).toBe(42);
  });

  it("validates required create fields and lifecycle actions", async () => {
    const createErrors = await validate(
      Object.assign(new MethodologyCreateDto(), {
        methodologyNumber: "",
        name: "",
        source: "",
        category: "not-a-sector",
      })
    );
    expect(createErrors.length).toBeGreaterThan(0);

    const lifecycleErrors = await validate(
      Object.assign(new MethodologyLifecycleDto(), { action: "remove" })
    );
    expect(lifecycleErrors.length).toBeGreaterThan(0);
  });
});
