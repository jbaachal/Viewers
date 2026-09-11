import type {
  Modality,
  Patient,
  PreviousExamination,
  Radiologist,
  Study,
  StudyNote,
  StudyPriority,
  StudyStatus,
  WorkflowEvent,
} from '../models';

export const MOCK_CURRENT_RADIOLOGIST_ID = 'rad-akello';

export const mockRadiologists: Radiologist[] = [
  {
    id: MOCK_CURRENT_RADIOLOGIST_ID,
    name: 'Dr Sarah Akello',
    role: 'RADIOLOGIST',
    initials: 'SA',
  },
  {
    id: 'rad-kato',
    name: 'Dr Daniel Kato',
    role: 'RADIOLOGIST',
    initials: 'DK',
  },
  {
    id: 'rad-namuli',
    name: 'Dr Ruth Namuli',
    role: 'RADIOLOGY_RESIDENT',
    initials: 'RN',
  },
];

const isoMinutesAgo = (now: Date, minutes: number) =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

const isoMinutesFromNow = (now: Date, minutes: number) =>
  new Date(now.getTime() + minutes * 60_000).toISOString();

const isoDaysAgo = (now: Date, days: number) =>
  new Date(now.getTime() - days * 86_400_000).toISOString();

type StudySeed = {
  suffix: number;
  patient: Patient;
  accessionNumber?: string | null;
  examination: string;
  modality: Modality;
  location: string;
  department: string;
  clinicalHistory: string;
  referringClinician: string;
  priority: StudyPriority;
  status: StudyStatus;
  receivedMinutesAgo: number;
  dueMinutesFromNow: number;
  assignedRadiologistId?: string | null;
  reservedByRadiologistId?: string | null;
  incomplete?: boolean;
  seriesCount: number;
  imageCount: number;
  note?: { type: StudyNote['type']; text: string; popupOnOpen?: boolean };
  previous?: { examination: string; modality: Modality; daysAgo: number; summary: string };
};

function createStudy(seed: StudySeed, now: Date): Study {
  const id = `study-${seed.suffix}`;
  const receivedAt = isoMinutesAgo(now, seed.receivedMinutesAgo);
  const assignedRadiologist = mockRadiologists.find(
    radiologist => radiologist.id === seed.assignedRadiologistId
  );
  const notes: StudyNote[] = seed.note
    ? [
        {
          id: `note-${seed.suffix}-1`,
          studyId: id,
          type: seed.note.type,
          text: seed.note.text,
          popupOnOpen: seed.note.popupOnOpen ?? false,
          createdBy: 'Amina Nansubuga, Radiographer',
          createdAt: isoMinutesAgo(now, Math.max(seed.receivedMinutesAgo - 4, 1)),
        },
      ]
    : [];
  const previousExaminations: PreviousExamination[] = seed.previous
    ? [
        {
          id: `previous-${seed.suffix}-1`,
          examination: seed.previous.examination,
          modality: seed.previous.modality,
          performedAt: isoDaysAgo(now, seed.previous.daysAgo),
          reportSummary: seed.previous.summary,
        },
      ]
    : [];
  const workflowHistory: WorkflowEvent[] = [
    {
      id: `event-${seed.suffix}-received`,
      studyId: id,
      type: 'STUDY_RECEIVED',
      description: `${seed.examination} received from ${seed.location}`,
      actor: 'PACS Gateway',
      occurredAt: receivedAt,
    },
  ];

  if (assignedRadiologist) {
    workflowHistory.unshift({
      id: `event-${seed.suffix}-assigned`,
      studyId: id,
      type: 'STUDY_ASSIGNED',
      description: `Study assigned to ${assignedRadiologist.name}`,
      actor: 'Radiology Coordinator',
      occurredAt: isoMinutesAgo(now, Math.max(seed.receivedMinutesAgo - 8, 1)),
    });
  }
  if (seed.note) {
    workflowHistory.unshift({
      id: `event-${seed.suffix}-note`,
      studyId: id,
      type: 'NOTE_ADDED',
      description: `${seed.note.type.toLowerCase()} note added`,
      actor: 'Amina Nansubuga',
      occurredAt: notes[0].createdAt,
    });
  }

  const reportedAt = ['REPORTED', 'VERIFIED'].includes(seed.status)
    ? isoMinutesAgo(now, Math.max(seed.receivedMinutesAgo - 35, 2))
    : null;
  const verifiedAt = seed.status === 'VERIFIED' ? isoMinutesAgo(now, 8) : null;

  return {
    id,
    studyInstanceUid: `1.2.826.0.1.3680043.10.9999.20260910.${seed.suffix}`,
    accessionNumber:
      seed.accessionNumber === undefined
        ? `MSWNH-RAD-26-${String(seed.suffix).padStart(5, '0')}`
        : seed.accessionNumber,
    patient: seed.patient,
    examination: seed.examination,
    modality: seed.modality,
    location: seed.location,
    department: seed.department,
    clinicalHistory: seed.clinicalHistory,
    referringClinician: seed.referringClinician,
    priority: seed.priority,
    status: seed.status,
    transmissionStatus: seed.incomplete ? 'INCOMPLETE' : 'COMPLETE',
    assignedRadiologistId: seed.assignedRadiologistId ?? null,
    assignedAt: seed.assignedRadiologistId
      ? isoMinutesAgo(now, Math.max(seed.receivedMinutesAgo - 8, 1))
      : null,
    reservedByRadiologistId: seed.reservedByRadiologistId ?? null,
    reservationExpiresAt: seed.reservedByRadiologistId ? isoMinutesFromNow(now, 12) : null,
    firstOpenedAt: seed.status === 'IN_REVIEW' ? isoMinutesAgo(now, 6) : null,
    reportingStartedAt: seed.status === 'IN_REVIEW' ? isoMinutesAgo(now, 5) : null,
    archiveStudyAvailable: false,
    scheduledAt: isoMinutesAgo(now, seed.receivedMinutesAgo + 25),
    studyAt: isoMinutesAgo(now, seed.receivedMinutesAgo + 7),
    receivedAt,
    reportDueAt: isoMinutesFromNow(now, seed.dueMinutesFromNow),
    reportedAt,
    verifiedAt,
    seriesCount: seed.seriesCount,
    imageCount: seed.imageCount,
    notes,
    previousExaminations,
    workflowHistory,
  };
}

export function createMockStudies(now = new Date()): Study[] {
  const seeds: StudySeed[] = [
    {
      suffix: 1,
      patient: {
        id: 'patient-1',
        mrn: 'MSWNH-P-260901',
        name: 'Nabirye Achen',
        dateOfBirth: '1992-04-16',
        sex: 'F',
      },
      examination: 'CT Pulmonary Angiogram',
      modality: 'CT',
      location: 'Emergency Unit',
      department: 'Emergency Medicine',
      clinicalHistory: 'Sudden dyspnoea and chest pain; exclude pulmonary embolism.',
      referringClinician: 'Dr Joan Atim',
      priority: 'EMERGENCY',
      status: 'RECEIVED',
      receivedMinutesAgo: 38,
      dueMinutesFromNow: -8,
      seriesCount: 7,
      imageCount: 486,
      note: {
        type: 'URGENT',
        text: 'Patient is haemodynamically unstable. Show this note when the study opens.',
        popupOnOpen: true,
      },
      previous: {
        examination: 'Chest radiograph',
        modality: 'CR',
        daysAgo: 41,
        summary: 'No focal air-space opacity.',
      },
    },
    {
      suffix: 2,
      patient: {
        id: 'patient-2',
        mrn: 'MSWNH-P-260902',
        name: 'Auma Kirabo',
        dateOfBirth: '1987-11-03',
        sex: 'F',
      },
      examination: 'Obstetric Ultrasound',
      modality: 'US',
      location: 'Antenatal Clinic',
      department: 'Obstetrics',
      clinicalHistory: 'Reduced fetal movements at 34 weeks.',
      referringClinician: 'Dr Peter Okello',
      priority: 'URGENT',
      status: 'ASSIGNED',
      receivedMinutesAgo: 72,
      dueMinutesFromNow: 18,
      assignedRadiologistId: 'rad-akello',
      seriesCount: 4,
      imageCount: 63,
      note: {
        type: 'CLINICAL',
        text: 'Please telephone the antenatal team when the report is available.',
      },
    },
    {
      suffix: 3,
      patient: {
        id: 'patient-3',
        mrn: 'MSWNH-P-260903',
        name: 'Mirembe Nakato',
        dateOfBirth: '2024-01-28',
        sex: 'F',
      },
      examination: 'Chest and Abdomen Radiograph',
      modality: 'DR',
      location: 'Neonatal ICU',
      department: 'Neonatology',
      clinicalHistory: 'Line position and abdominal distension.',
      referringClinician: 'Dr Agnes Nakiwala',
      priority: 'EMERGENCY',
      status: 'IN_REVIEW',
      receivedMinutesAgo: 21,
      dueMinutesFromNow: 9,
      assignedRadiologistId: 'rad-kato',
      reservedByRadiologistId: 'rad-kato',
      seriesCount: 2,
      imageCount: 2,
    },
    {
      suffix: 4,
      patient: {
        id: 'patient-4',
        mrn: 'MSWNH-P-260904',
        name: 'Lillian Nampiima',
        dateOfBirth: '1979-08-12',
        sex: 'F',
      },
      examination: 'MRI Pelvis',
      modality: 'MR',
      location: 'MRI Suite',
      department: 'Gynaecology',
      clinicalHistory: 'Staging of recently diagnosed cervical malignancy.',
      referringClinician: 'Dr Moses Ssemanda',
      priority: 'ROUTINE',
      status: 'ASSIGNED',
      receivedMinutesAgo: 185,
      dueMinutesFromNow: 535,
      assignedRadiologistId: 'rad-namuli',
      seriesCount: 11,
      imageCount: 712,
      previous: {
        examination: 'Pelvic ultrasound',
        modality: 'US',
        daysAgo: 22,
        summary: 'Irregular cervical mass; MRI recommended.',
      },
    },
    {
      suffix: 5,
      patient: {
        id: 'patient-5',
        mrn: 'MSWNH-P-260905',
        name: 'Grace Akoth',
        dateOfBirth: '1995-02-20',
        sex: 'F',
      },
      examination: 'CT Abdomen and Pelvis',
      modality: 'CT',
      location: 'Women’s Surgical Ward',
      department: 'Surgery',
      clinicalHistory: 'Post-operative fever and abdominal tenderness.',
      referringClinician: 'Dr Flavia Namusoke',
      priority: 'URGENT',
      status: 'RECEIVED',
      receivedMinutesAgo: 132,
      dueMinutesFromNow: -42,
      seriesCount: 6,
      imageCount: 392,
    },
    {
      suffix: 6,
      patient: {
        id: 'patient-6',
        mrn: 'MSWNH-P-260906',
        name: 'Immaculate Asiimwe',
        dateOfBirth: '1983-06-05',
        sex: 'F',
      },
      examination: 'Breast Ultrasound',
      modality: 'US',
      location: 'Breast Clinic',
      department: 'Breast Surgery',
      clinicalHistory: 'Palpable left breast lump.',
      referringClinician: 'Dr Brian Mugisha',
      priority: 'ROUTINE',
      status: 'INCOMPLETE',
      receivedMinutesAgo: 248,
      dueMinutesFromNow: 232,
      incomplete: true,
      assignedRadiologistId: 'rad-akello',
      seriesCount: 2,
      imageCount: 18,
      note: {
        type: 'TECHNICAL',
        text: 'Transmission stopped before cine clips completed; radiographer contacted.',
      },
    },
    {
      suffix: 7,
      patient: {
        id: 'patient-7',
        mrn: 'MSWNH-P-260907',
        name: 'Esther Atwine',
        dateOfBirth: '2001-12-09',
        sex: 'F',
      },
      examination: 'Chest Radiograph',
      modality: 'CR',
      location: 'Outpatient Radiology',
      department: 'Internal Medicine',
      clinicalHistory: 'Persistent cough for three weeks.',
      referringClinician: 'Dr Sam Ocen',
      priority: 'ROUTINE',
      status: 'REPORTED',
      receivedMinutesAgo: 96,
      dueMinutesFromNow: 384,
      assignedRadiologistId: 'rad-kato',
      seriesCount: 1,
      imageCount: 2,
    },
    {
      suffix: 8,
      patient: {
        id: 'patient-8',
        mrn: 'MSWNH-P-260908',
        name: 'Hadijah Nakaweesi',
        dateOfBirth: '1990-10-23',
        sex: 'F',
      },
      examination: 'Renal Ultrasound',
      modality: 'US',
      location: 'Medical Ward',
      department: 'Internal Medicine',
      clinicalHistory: 'Acute kidney injury; assess for obstruction.',
      referringClinician: 'Dr Isaac Wekesa',
      priority: 'URGENT',
      status: 'RECEIVED',
      receivedMinutesAgo: 61,
      dueMinutesFromNow: 29,
      accessionNumber: null,
      seriesCount: 5,
      imageCount: 44,
    },
    {
      suffix: 9,
      patient: {
        id: 'patient-9',
        mrn: 'MSWNH-P-260909',
        name: 'Rebecca Kemigisa',
        dateOfBirth: '1988-05-14',
        sex: 'F',
      },
      examination: 'MRI Brain',
      modality: 'MR',
      location: 'MRI Suite',
      department: 'Neurology',
      clinicalHistory: 'New onset seizures.',
      referringClinician: 'Dr Andrew Lule',
      priority: 'ROUTINE',
      status: 'VERIFIED',
      receivedMinutesAgo: 310,
      dueMinutesFromNow: 170,
      assignedRadiologistId: 'rad-akello',
      seriesCount: 9,
      imageCount: 605,
    },
    {
      suffix: 10,
      patient: {
        id: 'patient-10',
        mrn: 'MSWNH-P-260910',
        name: 'Joyce Alanyo',
        dateOfBirth: '1998-09-02',
        sex: 'F',
      },
      examination: 'Pelvic Ultrasound',
      modality: 'US',
      location: 'Gynaecology Clinic',
      department: 'Gynaecology',
      clinicalHistory: 'Pelvic pain and irregular bleeding.',
      referringClinician: 'Dr Sharon Nambasa',
      priority: 'ROUTINE',
      status: 'RECEIVED',
      receivedMinutesAgo: 27,
      dueMinutesFromNow: 453,
      seriesCount: 4,
      imageCount: 37,
    },
    {
      suffix: 11,
      patient: {
        id: 'patient-11',
        mrn: 'MSWNH-P-260911',
        name: 'Patience Apio',
        dateOfBirth: '1993-03-17',
        sex: 'F',
      },
      examination: 'CT Head',
      modality: 'CT',
      location: 'Emergency Unit',
      department: 'Emergency Medicine',
      clinicalHistory: 'Acute severe headache with reduced consciousness.',
      referringClinician: 'Dr Denis Byaruhanga',
      priority: 'EMERGENCY',
      status: 'ASSIGNED',
      receivedMinutesAgo: 14,
      dueMinutesFromNow: 16,
      assignedRadiologistId: 'rad-akello',
      seriesCount: 3,
      imageCount: 168,
    },
    {
      suffix: 12,
      patient: {
        id: 'patient-12',
        mrn: 'MSWNH-P-260912',
        name: 'Mercy Namaganda',
        dateOfBirth: '1985-07-30',
        sex: 'F',
      },
      examination: 'Lumbar Spine Radiograph',
      modality: 'DR',
      location: 'Outpatient Radiology',
      department: 'Orthopaedics',
      clinicalHistory: 'Lower back pain following a minor fall.',
      referringClinician: 'Dr Ronald Tumusiime',
      priority: 'ROUTINE',
      status: 'CANCELLED',
      receivedMinutesAgo: 1_530,
      dueMinutesFromNow: -1_050,
      seriesCount: 0,
      imageCount: 0,
      note: {
        type: 'GENERAL',
        text: 'Examination cancelled after duplicate request was confirmed.',
      },
    },
  ];

  return seeds.map(seed => createStudy(seed, now));
}
