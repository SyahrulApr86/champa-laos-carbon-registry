import { CaslAbilityFactory } from "../casl/casl-ability.factory";
import { Action } from "../casl/action.enum";
import { Role } from "../casl/role.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { MethodologyEntity } from "../entities/methodology.entity";

describe("Methodology CASL policy", () => {
  const factory = new CaslAbilityFactory();

  it("denies non-admin users management actions", () => {
    const ability = factory.createForUser({
      id: 4,
      role: Role.Manager,
      companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
      companyId: 10,
      companyState: 1,
    } as any);

    expect(ability.can(Action.Read, MethodologyEntity)).toBe(false);
    expect(ability.can(Action.Update, MethodologyEntity)).toBe(false);
    expect(ability.can(Action.Delete, MethodologyEntity)).toBe(false);
  });

  it("allows the configured DNA admin management boundary", () => {
    const ability = factory.createForUser({
      id: 5,
      role: Role.Admin,
      companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
      companyId: 10,
      companyState: 1,
    } as any);

    expect(ability.can(Action.Read, MethodologyEntity)).toBe(true);
    expect(ability.can(Action.Create, MethodologyEntity)).toBe(true);
    expect(ability.can(Action.Update, MethodologyEntity)).toBe(true);
    expect(ability.can(Action.Delete, MethodologyEntity)).toBe(true);
  });
});
