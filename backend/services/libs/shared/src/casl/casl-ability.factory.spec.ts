import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './action.enum';
import { Role } from './role.enum';
import { CompanyRole } from '../enum/company.role.enum';
import { Programme } from '../entities/programme.entity';

describe('CaslAbilityFactory', () => {
  it('should be defined', () => {
    expect(new CaslAbilityFactory()).toBeDefined();
  });

  it('allows non-view-only DNA management and denies view-only management', () => {
    const factory = new CaslAbilityFactory();
    const manager = factory.createForUser({ role: Role.Manager, companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY } as any);
    const viewer = factory.createForUser({ role: Role.ViewOnly, companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY } as any);

    expect(manager.can(Action.Update, Programme)).toBe(true);
    expect(viewer.can(Action.Update, Programme)).toBe(false);
  });
});
