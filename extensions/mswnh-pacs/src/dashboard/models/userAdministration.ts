export type PacsRole = {
  name: string;
  displayName: string;
  description: string;
};

export type PacsUser = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  enabled: boolean;
  roles: string[];
  createdTimestamp?: number | null;
};

export type PacsUserList = {
  users: PacsUser[];
  total: number;
  first: number;
  pageSize: number;
};

export type CreatePacsUser = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  initialPassword: string;
  temporaryPassword: boolean;
  roles: string[];
  signatureFile?: File | null;
  removeSignature?: boolean;
};

export type UpdatePacsUser = Omit<
  CreatePacsUser,
  'username' | 'initialPassword' | 'temporaryPassword'
>;
