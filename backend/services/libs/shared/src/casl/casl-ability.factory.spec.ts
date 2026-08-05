import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './action.enum';
import { Role } from './role.enum';
import { CompanyRole } from '../enum/company.role.enum';
import { NdcTargetEntity } from '../entities/ndc.target.entity';
import { RecognizedMitigationEntity } from '../entities/recognized.mitigation.entity';
import { ReddPlusEntity } from '../entities/redd.plus.entity';

describe('CaslAbilityFactory', () => {
  it('should be defined', () => {
    expect(new CaslAbilityFactory()).toBeDefined();
  });

  it("allows only root or DNA/Ministry admins to manage the three source datasets", () => {
    const factory = new CaslAbilityFactory();
    const dnaAdmin = factory.createForUser({
      role: Role.Admin,
      companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
      companyState: 1,
    } as any);
    const viewOnly = factory.createForUser({
      role: Role.ViewOnly,
      companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
      companyState: 1,
    } as any);

    for (const subject of [NdcTargetEntity, RecognizedMitigationEntity, ReddPlusEntity]) {
      expect(dnaAdmin.can(Action.Manage, subject)).toBe(true);
      expect(viewOnly.can(Action.Manage, subject)).toBe(false);
    }
  });
});
