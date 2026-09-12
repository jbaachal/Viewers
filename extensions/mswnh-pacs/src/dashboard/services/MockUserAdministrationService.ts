import type { CreatePacsUser, PacsRole, PacsUser, PacsUserList, UpdatePacsUser } from '../models';
import type { UserAdministrationService } from './UserAdministrationService';

const roles: PacsRole[] = [
  {
    name: 'SUPER_ADMINISTRATOR',
    displayName: 'Super Administrator',
    description:
      'Full control over users, roles, SLA settings, system monitoring, clinical workflow, and management reporting.',
  },
  {
    name: 'PACS_ADMINISTRATOR',
    displayName: 'PACS Administrator',
    description: 'Manage PACS users, SLA settings, system monitoring, and operational workflow.',
  },
  {
    name: 'RADIOLOGIST',
    displayName: 'Radiologist',
    description:
      'Review studies, claim assignments, create and sign reports, and manage clinical notes.',
  },
  {
    name: 'RADIOLOGY_RESIDENT',
    displayName: 'Radiology Resident',
    description:
      'Review studies, claim assignments, and prepare and sign reports as part of supervised radiology workflow.',
  },
  {
    name: 'RADIOGRAPHER_SONOGRAPHER',
    displayName: 'Radiographer/Sonographer',
    description: 'View worklists, perform acquisition workflow, and flag incomplete examinations.',
  },
  {
    name: 'REFERRING_CLINICIAN',
    displayName: 'Referring Clinician',
    description:
      'View PACS studies and reports for clinical care without reporting or administrative access.',
  },
  {
    name: 'RECEPTION_OFFICER',
    displayName: 'Reception Officer',
    description:
      'Search patients and studies and view worklist demographics without clinical reporting or administration.',
  },
  {
    name: 'DEPARTMENT_HEAD',
    displayName: 'Department Head',
    description:
      'View management reports, assign and reprioritize studies, and verify completed workflow.',
  },
];

export class MockUserAdministrationService implements UserAdministrationService {
  private users: PacsUser[] = [
    {
      id: 'demo-admin',
      username: 'pacs.admin',
      firstName: 'PACS',
      lastName: 'Administrator',
      email: 'pacs.admin@example.invalid',
      enabled: true,
      roles: ['PACS_ADMINISTRATOR'],
      createdTimestamp: Date.now(),
    },
  ];

  async getUsers(search = '', first = 0, pageSize = 25): Promise<PacsUserList> {
    const term = search.trim().toLowerCase();
    const filtered = this.users.filter(user =>
      [user.username, user.firstName, user.lastName, user.email].some(value =>
        value?.toLowerCase().includes(term)
      )
    );
    return {
      users: filtered.slice(first, first + pageSize),
      total: filtered.length,
      first,
      pageSize,
    };
  }

  async getRoles(): Promise<PacsRole[]> {
    return roles;
  }

  async createUser(input: CreatePacsUser): Promise<PacsUser> {
    const {
      initialPassword: _initialPassword,
      temporaryPassword: _temporaryPassword,
      ...profile
    } = input;
    const user: PacsUser = {
      ...profile,
      id: crypto.randomUUID(),
      createdTimestamp: Date.now(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: string, input: UpdatePacsUser): Promise<PacsUser> {
    const index = this.users.findIndex(user => user.id === id);
    if (index < 0) throw new Error('The user was not found.');
    this.users[index] = { ...this.users[index], ...input };
    return this.users[index];
  }

  async resetPassword(): Promise<void> {}
}
