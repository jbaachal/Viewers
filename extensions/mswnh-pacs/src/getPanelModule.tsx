import React from 'react';

import StudyNotesPanel from './panels/StudyNotesPanel';
import StudyReportPanel from './panels/StudyReportPanel';

export default function getPanelModule() {
  return [
    {
      name: 'studyNotes',
      iconName: 'clipboard',
      iconLabel: 'Notes',
      label: 'Notes',
      component: StudyNotesPanel,
    },
    {
      name: 'studyReport',
      iconName: 'tab-patient-info',
      iconLabel: 'Report',
      label: 'Report',
      component: StudyReportPanel,
    },
  ];
}
