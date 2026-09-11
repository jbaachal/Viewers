import { useEffect, useMemo, useState } from 'react';

export function useKampalaClock() {
  const [now, setNow] = useState(() => new Date());
  const timeZone = window.config?.dashboard?.timeZone || 'Africa/Kampala';

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  return useMemo(
    () => ({
      date: new Intl.DateTimeFormat('en-UG', {
        timeZone,
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now),
      time: new Intl.DateTimeFormat('en-UG', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now),
      timeZone,
    }),
    [now, timeZone]
  );
}
