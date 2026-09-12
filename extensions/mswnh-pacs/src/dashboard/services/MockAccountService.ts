import type { AccountService } from './AccountService';

export class MockAccountService implements AccountService {
  async changePassword(_oldPassword: string, _newPassword: string): Promise<void> {}
}
