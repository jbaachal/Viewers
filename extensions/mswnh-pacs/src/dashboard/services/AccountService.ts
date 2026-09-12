export interface AccountService {
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
}
