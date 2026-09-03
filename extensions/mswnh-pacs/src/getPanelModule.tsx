import React from 'react';

import StudyNotesPanel from './panels/StudyNotesPanel';

export default function getPanelModule() {
  return [
    {
      name: 'studyNotes',
      iconName: 'clipboard',
      iconLabel: 'Study Notes',
      label: 'Study Notes',
      component: StudyNotesPanel,
    },
  ];
}
