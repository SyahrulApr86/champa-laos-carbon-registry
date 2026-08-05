import { validate } from "class-validator";
import { ExpertCreateDto } from "./expert.create.dto";
import { GuidanceDocumentCreateDto } from "./guidance.document.create.dto";

describe("CRUD-07 DTO validation", () => {
  it("rejects an experience value outside the roster range", async () => {
    const dto = Object.assign(new ExpertCreateDto(), {
      name: "Expert",
      affiliation: "DNA",
      expertise: "MRV",
      province: "Vientiane Capital",
      yearsOfExperience: 81,
    });

    expect(await validate(dto)).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: "yearsOfExperience" })])
    );
  });

  it("accepts HTTPS and base64 document references but rejects script URLs", async () => {
    const valid = Object.assign(new GuidanceDocumentCreateDto(), {
      title: "Guidance",
      documentUrl: "data:application/pdf;base64,ZmFrZQ==",
    });
    expect(await validate(valid)).toHaveLength(0);

    const invalid = Object.assign(new GuidanceDocumentCreateDto(), {
      title: "Unsafe",
      documentUrl: "javascript:alert(1)",
    });
    expect(await validate(invalid)).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: "documentUrl" })])
    );
  });
});
