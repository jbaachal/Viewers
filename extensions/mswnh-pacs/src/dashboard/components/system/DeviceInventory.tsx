import React from 'react';

import type { DicomDeviceHealth } from '../../models';
import { formatKampalaDateTime } from '../../utils/formatDashboardDate';
import { SystemStatusBadge } from './SystemStatusBadge';

export function DeviceInventory({ devices }: { devices: DicomDeviceHealth[] }) {
  if (!devices.length) {
    return (
      <div className="text-muted-foreground p-8 text-center text-sm">
        No DICOM devices are configured. Add AE endpoints to the System Monitoring configuration to
        populate this inventory.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {devices.map(device => {
        const enabledAes = device.aeTitles.filter(ae => ae.enabled).length;
        return (
          <article
            key={device.id}
            className="border-input/60 bg-card overflow-hidden rounded-xl border"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-lg font-semibold">{device.name}</h3>
                  <SystemStatusBadge state={device.state} />
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{device.message}</p>
              </div>
              <div className="text-muted-foreground text-right text-xs">
                <div>
                  {device.aeTitles.length} configured AE title
                  {device.aeTitles.length === 1 ? '' : 's'}
                </div>
                <div>
                  {enabledAes} connectivity check{enabledAes === 1 ? '' : 's'} enabled
                </div>
              </div>
            </div>

            <dl className="border-input/40 bg-muted/15 grid gap-3 border-y p-4 text-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <Detail
                label="Device ID"
                value={device.id}
              />
              <Detail
                label="Modality"
                value={device.modalities.join(', ') || 'Not supplied'}
              />
              <Detail
                label="Manufacturer / model"
                value={
                  [device.manufacturer, device.model].filter(Boolean).join(' ') || 'Not supplied'
                }
              />
              <Detail
                label="Serial number"
                value={device.serialNumber || 'Not supplied'}
              />
              <Detail
                label="Location"
                value={
                  [device.department, device.location].filter(Boolean).join(' · ') || 'Not supplied'
                }
              />
              <Detail
                label="Last study received (modality)"
                value={
                  device.lastStudyReceivedAt
                    ? formatKampalaDateTime(device.lastStudyReceivedAt)
                    : 'No study recorded'
                }
              />
            </dl>

            <div
              className="mswnh-scroll-region overflow-x-auto"
              role="region"
              aria-label={`${device.name} AE titles`}
              tabIndex={0}
            >
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-muted-foreground bg-muted/25 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="p-3">Called AE title</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Calling AE</th>
                    <th className="p-3">Transport</th>
                    <th className="p-3">Connectivity</th>
                    <th className="p-3">Response</th>
                    <th className="p-3">Last checked</th>
                  </tr>
                </thead>
                <tbody>
                  {device.aeTitles.map(ae => (
                    <tr
                      key={ae.id}
                      className="border-input/40 border-t align-top"
                    >
                      <td className="text-foreground p-3 font-mono font-medium">
                        {ae.aeTitle || 'Not supplied'}
                      </td>
                      <td className="text-foreground p-3 font-mono">
                        {ae.host ? `${ae.host}:${ae.port}` : 'Not supplied'}
                      </td>
                      <td className="text-muted-foreground p-3 font-mono">
                        {ae.callingAeTitle || 'Not supplied'}
                      </td>
                      <td className="text-muted-foreground p-3">
                        {ae.useTls ? 'DICOM TLS' : 'DICOM'}
                      </td>
                      <td className="p-3">
                        <SystemStatusBadge state={ae.state} />
                        {!ae.enabled && (
                          <span className="text-muted-foreground mt-1 block text-xs">Disabled</span>
                        )}
                      </td>
                      <td className="text-muted-foreground max-w-sm p-3">
                        <span className="text-foreground block tabular-nums">
                          {ae.responseTimeMs === null ? '—' : `${ae.responseTimeMs} ms`}
                        </span>
                        <span className="mt-1 block text-xs">{ae.message}</span>
                      </td>
                      <td className="text-muted-foreground p-3 text-xs">
                        {formatKampalaDateTime(ae.lastCheckedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="text-foreground mt-1 break-words">{value}</dd>
    </div>
  );
}
