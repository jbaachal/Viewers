import type { SlaSettings, UpdateSlaSettings } from '../models';
import type { SlaAdministrationService } from './SlaAdministrationService';

export class MockSlaAdministrationService implements SlaAdministrationService {
  private settings: SlaSettings = {
    emergencyMinutes: 30,
    urgentMinutes: 120,
    routineMinutes: 1440,
    warningBeforeDueMinutes: 30,
    version: crypto.randomUUID(),
    updatedBy: null,
    updatedAt: null,
  };

  async getSettings(): Promise<SlaSettings> {
    return { ...this.settings };
  }

  async updateSettings(input: UpdateSlaSettings): Promise<SlaSettings> {
    this.settings = {
      ...input,
      version: crypto.randomUUID(),
      updatedBy: 'PACS Administrator',
      updatedAt: new Date().toISOString(),
      activeStudiesRecalculated: input.applyToActiveStudies ? 2 : 0,
    };
    return { ...this.settings };
  }
}
