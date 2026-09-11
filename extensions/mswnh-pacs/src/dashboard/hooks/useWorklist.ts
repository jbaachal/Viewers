import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type {
  Modality,
  Study,
  StudyPriority,
  StudyQuery,
  StudyQuickFilter,
  StudySortField,
  StudyStatus,
} from '../models';
import { useDashboardContext } from '../context/DashboardProvider';

export type WorklistFilters = {
  search: string;
  priority: StudyPriority | '';
  status: StudyStatus | '';
  modality: Modality | '';
  dateFrom: string;
  dateTo: string;
  assignedToMe: boolean;
  quickFilters: StudyQuickFilter[];
  sortBy: StudySortField | '';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
};

const priorityValues: StudyPriority[] = ['EMERGENCY', 'URGENT', 'ROUTINE'];
const statusValues: StudyStatus[] = [
  'RECEIVED',
  'ASSIGNED',
  'IN_REVIEW',
  'REPORTED',
  'VERIFIED',
  'CANCELLED',
  'INCOMPLETE',
];
const modalityValues: Modality[] = ['CT', 'US', 'CR', 'DR', 'MR'];
const quickFilterValues: StudyQuickFilter[] = [
  'EMERGENCY',
  'URGENT',
  'UNREAD',
  'ASSIGNED_TO_ME',
  'UNASSIGNED',
  'RESERVED_BY_ME',
  'IN_REVIEW',
  'AWAITING_VERIFICATION',
  'OVERDUE',
  'CT',
  'ULTRASOUND',
  'TODAY',
];
const sortValues: StudySortField[] = [
  'priority',
  'receivedAt',
  'patientName',
  'examination',
  'status',
];

function oneOf<T extends string>(value: string | null, allowed: T[]): T | '' {
  const normalized = value?.toLocaleLowerCase() ?? '';
  return allowed.find(candidate => candidate.toLocaleLowerCase() === normalized) ?? '';
}

function parseFilters(params: URLSearchParams): WorklistFilters {
  const quickFilters = (params.get('quick') ?? '')
    .split(',')
    .map(value => value.toUpperCase())
    .filter((value): value is StudyQuickFilter =>
      quickFilterValues.includes(value as StudyQuickFilter)
    );
  const priority = oneOf(params.get('priority'), priorityValues);
  const rawStatus = params.get('status');
  const status = oneOf(rawStatus, statusValues);
  const modality = oneOf(params.get('modality'), modalityValues);

  if (rawStatus?.toLowerCase() === 'unread') quickFilters.push('UNREAD');
  if (params.get('assigned') === 'me') quickFilters.push('ASSIGNED_TO_ME');
  if (params.get('unassigned') === 'true') quickFilters.push('UNASSIGNED');
  if (params.get('reserved') === 'me') quickFilters.push('RESERVED_BY_ME');
  if (params.get('overdue') === 'true') quickFilters.push('OVERDUE');
  if (params.get('date') === 'today') quickFilters.push('TODAY');

  return {
    search: params.get('search') ?? '',
    priority,
    status,
    modality,
    dateFrom: params.get('from') ?? '',
    dateTo: params.get('to') ?? '',
    assignedToMe: params.get('assigned') === 'me',
    quickFilters: Array.from(new Set(quickFilters)),
    sortBy: oneOf(params.get('sort'), sortValues),
    sortDirection: params.get('direction') === 'desc' ? 'desc' : 'asc',
    page: Math.max(Number(params.get('page')) || 1, 1),
    pageSize: 10,
  };
}

function serializeFilters(filters: WorklistFilters, selectedStudyId?: string | null) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.priority) params.set('priority', filters.priority.toLowerCase());
  if (filters.status) params.set('status', filters.status.toLowerCase());
  if (filters.modality) params.set('modality', filters.modality.toLowerCase());
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  if (filters.dateTo) params.set('to', filters.dateTo);
  if (filters.assignedToMe) params.set('assigned', 'me');
  if (filters.quickFilters.length) params.set('quick', filters.quickFilters.join(','));
  if (filters.sortBy) params.set('sort', filters.sortBy);
  if (filters.sortDirection === 'desc') params.set('direction', 'desc');
  if (filters.page > 1) params.set('page', String(filters.page));
  if (selectedStudyId) params.set('study', selectedStudyId);
  return params;
}

export function useWorklist() {
  const { services } = useDashboardContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const selectedStudyId = searchParams.get('study');
  const [studies, setStudies] = useState<Study[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const query = useMemo<StudyQuery>(
    () => ({
      search: filters.search,
      priorities: filters.priority ? [filters.priority] : undefined,
      statuses: filters.status ? [filters.status] : undefined,
      modalities: filters.modality ? [filters.modality] : undefined,
      dateFrom: filters.dateFrom
        ? new Date(`${filters.dateFrom}T00:00:00+03:00`).toISOString()
        : undefined,
      dateTo: filters.dateTo
        ? new Date(`${filters.dateTo}T23:59:59+03:00`).toISOString()
        : undefined,
      assignedToMe: filters.assignedToMe,
      quickFilters: filters.quickFilters,
      sortBy: filters.sortBy || undefined,
      sortDirection: filters.sortDirection,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters]
  );

  const refresh = useCallback(async () => {
    if (!services) return;
    setLoading(true);
    try {
      const result = await services.worklist.queryStudies(query);
      setStudies(result.studies);
      setTotal(result.total);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error('The worklist could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [query, services]);

  useEffect(() => {
    void refresh();
    const unsubscribe = services?.worklist.subscribe(() => void refresh());
    const poll = window.setInterval(() => void refresh(), 20_000);
    return () => {
      unsubscribe?.();
      window.clearInterval(poll);
    };
  }, [refresh, services]);

  const updateFilters = useCallback(
    (patch: Partial<WorklistFilters>) => {
      const next = { ...filters, ...patch };
      if (!('page' in patch)) next.page = 1;
      setSearchParams(serializeFilters(next, selectedStudyId));
    },
    [filters, selectedStudyId, setSearchParams]
  );

  const toggleQuickFilter = useCallback(
    (filter: StudyQuickFilter) => {
      const quickFilters = filters.quickFilters.includes(filter)
        ? filters.quickFilters.filter(candidate => candidate !== filter)
        : [...filters.quickFilters, filter];
      updateFilters({ quickFilters });
    },
    [filters.quickFilters, updateFilters]
  );

  const selectStudy = useCallback(
    (studyId: string | null) => setSearchParams(serializeFilters(filters, studyId)),
    [filters, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    const reset = parseFilters(new URLSearchParams());
    setSearchParams(serializeFilters(reset, selectedStudyId));
  }, [selectedStudyId, setSearchParams]);

  return {
    filters,
    studies,
    total,
    loading,
    error,
    selectedStudyId,
    pageCount: Math.max(Math.ceil(total / filters.pageSize), 1),
    refresh,
    updateFilters,
    toggleQuickFilter,
    selectStudy,
    resetFilters,
  };
}
