const KAMPALA_TIME_ZONE = 'Africa/Kampala';

export function formatKampalaDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: KAMPALA_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatKampalaTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: KAMPALA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatElapsed(receivedAt: string, now = new Date()): string {
  const minutes = Math.max(
    0,
    Math.round((now.getTime() - new Date(receivedAt).getTime()) / 60_000)
  );
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / 1_440)}d ${Math.floor((minutes % 1_440) / 60)}h`;
}

export function formatRemaining(value: string | null, now = new Date()): string {
  if (!value) return 'SLA not configured';
  const minutes = Math.round((new Date(value).getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return `${Math.abs(minutes)}m overdue`;
  if (minutes < 60) return `${minutes}m remaining`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining`;
}
