import type { CreatePacsUser, PacsRole, PacsUser, PacsUserList, UpdatePacsUser } from '../models';

export interface UserAdministrationService {
  getUsers(search?: string, first?: number, pageSize?: number): Promise<PacsUserList>;
  getRoles(): Promise<PacsRole[]>;
  getSignature(id: string): Promise<Blob | null>;
  createUser(input: CreatePacsUser): Promise<PacsUser>;
  updateUser(id: string, input: UpdatePacsUser): Promise<PacsUser>;
  resetPassword(id: string, password: string, temporary: boolean): Promise<void>;
}
