import { CaslAbilityFactory } from "../casl/casl-ability.factory";
import { Action } from "../casl/action.enum";
import { Role } from "../casl/role.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { EmissionCeilingEntity } from "../entities/emission.ceiling.entity";
import { EmissionParticipantEntity } from "../entities/emission.participant.entity";
import { EmissionTradingEntity } from "../entities/emission.trading.entity";

const user = (role: Role, companyRole: CompanyRole) =>
  ({
    id: 7,
    role,
    companyRole,
    companyId: 1,
    companyState: 1,
  } as any);

describe("CRUD-03 emission management policy", () => {
  const factory = new CaslAbilityFactory();

  it("allows DNA/Ministry admins to read and update all three domains", () => {
    for (const companyRole of [CompanyRole.DESIGNATED_NATIONAL_AUTHORITY, CompanyRole.MINISTRY]) {
      const ability = factory.createForUser(user(Role.Admin, companyRole));
      for (const subject of [EmissionCeilingEntity, EmissionTradingEntity, EmissionParticipantEntity]) {
        expect(ability.can(Action.Read, subject)).toBe(true);
        expect(ability.can(Action.Update, subject)).toBe(true);
      }
    }
  });

  it("does not grant market administration to a non-admin participant role", () => {
    const ability = factory.createForUser(
      user(Role.Manager, CompanyRole.PROJECT_DEVELOPER)
    );
    expect(ability.can(Action.Read, EmissionTradingEntity)).toBe(false);
    expect(ability.can(Action.Update, EmissionTradingEntity)).toBe(false);
  });
});
