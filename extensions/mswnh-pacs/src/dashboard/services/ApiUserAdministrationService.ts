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

  async getSignature(id: string): Promise<Blob | null> {
    const response = await this.fetchSignature(id);
    if (response.status === 404) return null;
    if (!response.ok) throw await this.parseResponseError(response);
    return response.blob();
  }

  async createUser(input: CreatePacsUser): Promise<PacsUser> {
    const { signatureFile, removeSignature: _removeSignature, ...account } = input;
    const user = await this.request<PacsUser>('', {
      method: 'POST',
      body: JSON.stringify(account),
    });
    if (signatureFile) await this.putSignature(user.id, signatureFile);
    return user;
  }

  async updateUser(id: string, input: UpdatePacsUser): Promise<PacsUser> {
    const { signatureFile, removeSignature, ...account } = input;
    const user = await this.request<PacsUser>(`/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
    if (removeSignature) await this.deleteSignature(id);
    if (signatureFile) await this.putSignature(id, signatureFile);
    return user;
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

  private fetchSignature(id: string, init: RequestInit = {}): Promise<Response> {
    return fetch(
      `${this.baseUrl.replace(/\/$/, '')}/api/administration/users/${encodeURIComponent(id)}/signature`,
      {
        ...init,
        headers: {
          Accept: 'image/png,image/jpeg',
          ...this.getAuthorizationHeaders(),
          ...init.headers,
        },
      }
    );
  }

  private async putSignature(id: string, signature: File): Promise<void> {
    const form = new FormData();
    form.append('signature', signature);
    const response = await this.fetchSignature(id, { method: 'PUT', body: form });
    if (!response.ok) throw await this.parseResponseError(response);
  }

  private async deleteSignature(id: string): Promise<void> {
    const response = await this.fetchSignature(id, { method: 'DELETE' });
    if (!response.ok) throw await this.parseResponseError(response);
  }

  private async parseResponseError(response: Response): Promise<UserAdministrationApiError> {
    if (response.status === 401) this.handleUnauthenticated?.();
    const problem = await response.json().catch(() => ({}));
    return new UserAdministrationApiError(
      response.status,
      problem.detail || problem.title || `User administration request failed (${response.status}).`
    );
  }
}
