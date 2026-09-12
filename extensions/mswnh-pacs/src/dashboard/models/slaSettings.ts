export type SlaSettings = {
  emergencyMinutes: number;
  urgentMinutes: number;
  routineMinutes: number;
  warningBeforeDueMinutes: number;
  version: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  activeStudiesRecalculated?: number;
};

export type UpdateSlaSettings = Pick<
  SlaSettings,
  'emergencyMinutes' | 'urgentMinutes' | 'routineMinutes' | 'warningBeforeDueMinutes' | 'version'
> & {
  applyToActiveStudies: boolean;
};
