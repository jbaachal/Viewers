import type { AccountService } from './AccountService';

export class AccountApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'AccountApiError';
  }
}

export class ApiAccountService implements AccountService {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/account/password`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.getAuthorizationHeaders(),
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new AccountApiError(
        response.status,
        problem.detail || problem.title || `Password change failed (${response.status}).`
      );
    }
  }
}
