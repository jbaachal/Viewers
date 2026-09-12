import type { CreatePacsUser, PacsRole, PacsUser, PacsUserList, UpdatePacsUser } from '../models';
import type { UserAdministrationService } from './UserAdministrationService';

export class UserAdministrationApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'UserAdministrationApiError';
  }
}

export class ApiUserAdministrationService implements UserAdministrationService {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  getUsers(search = '', first = 0, pageSize = 25): Promise<PacsUserList> {
    const query = new URLSearchParams({
      first: String(first),
      pageSize: String(pageSize),
    });
    if (search.trim()) query.set('search', search.trim());
    return this.request<PacsUserList>(`?${query}`);
  }

  getRoles(): Promise<PacsRole[]> {
    return this.request<PacsRole[]>('/roles');
  }

  createUser(input: CreatePacsUser): Promise<PacsUser> {
    return this.request<PacsUser>('', { method: 'POST', body: JSON.stringify(input) });
  }

  updateUser(id: string, input: UpdatePacsUser): Promise<PacsUser> {
    return this.request<PacsUser>(`/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  resetPassword(id: string, password: string, temporary: boolean): Promise<void> {
    return this.request<void>(`/${encodeURIComponent(id)}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password, temporary }),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, '')}/api/administration/users${path}`,
      {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...this.getAuthorizationHeaders(),
          ...init.headers,
        },
      }
    );
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new UserAdministrationApiError(
        response.status,
        problem.detail ||
          problem.title ||
          `User administration request failed (${response.status}).`
      );
    }
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }
}
