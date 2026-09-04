import React from 'react';

import StudyNotesPanel from './panels/StudyNotesPanel';
import StudyReportPanel from './panels/StudyReportPanel';

export default function getPanelModule() {
  return [
    {
      name: 'studyNotes',
      iconName: 'clipboard',
      iconLabel: 'Study Notes',
      label: 'Study Notes',
      component: StudyNotesPanel,
    },
    {
      name: 'studyReport',
      iconName: 'tab-patient-info',
      iconLabel: 'Study Report',
      label: 'Study Report',
      component: StudyReportPanel,
    },
  ];
}
