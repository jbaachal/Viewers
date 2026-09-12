import type { SlaSettings, UpdateSlaSettings } from '../models';

export interface SlaAdministrationService {
  getSettings(): Promise<SlaSettings>;
  updateSettings(input: UpdateSlaSettings): Promise<SlaSettings>;
}
