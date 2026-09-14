import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { DashboardLoadingSkeleton } from '../components/dashboard';
import { useDashboardContext } from '../context/DashboardProvider';
import type { DeviceCatalogValue, DicomDevice, UpdateDicomDevice } from '../models';
import { formatKampalaDateTime } from '../utils/formatDashboardDate';

const empty = (value: string) => value.trim() || null;

function DeviceEditor({
  device,
  devices,
  busy,
  onClose,
  onSave,
  onSaveEndpoint,
  onMerge,
  catalogValues,
}: {
  device: DicomDevice;
  devices: DicomDevice[];
  busy: boolean;
  onClose: () => void;
  onSave: (input: UpdateDicomDevice) => Promise<void>;
  onSaveEndpoint: (
    endpointId: string,
    host: string,
    port: string,
    enabled: boolean,
    tls: boolean
  ) => Promise<void>;
  onMerge: (targetId: string) => Promise<void>;
  catalogValues: DeviceCatalogValue[];
}) {
  const [form, setForm] = useState({
    name: device.name,
    modality: device.modality ?? '',
    manufacturer: device.manufacturer ?? '',
    model: device.model ?? '',
    serialNumber: device.serialNumber ?? '',
    location: device.location ?? '',
    department: device.department ?? '',
    isActive: device.isActive,
  });
  const [mergeTarget, setMergeTarget] = useState('');
  const field = (key: keyof typeof form, label: string, required = false) => (
    <label className="text-foreground text-sm">
      <span className="mb-1 block font-medium">
        {label}
        {required ? '*' : ''}
      </span>
      <Input
        value={String(form[key])}
        onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))}
      />
    </label>
  );
  const catalogField = (
    key: 'modality' | 'department' | 'manufacturer',
    label: string,
    category: DeviceCatalogValue['category'],
    required = false
  ) => {
    const values = catalogValues.filter(item => item.category === category && item.isActive);
    const current = form[key];
    if (current && !values.some(item => item.value === current)) {
      values.unshift({ id: `current-${key}`, category, value: current, isActive: true, sortOrder: -1 });
    }
    return (
      <label className="text-foreground text-sm">
        <span className="mb-1 block font-medium">{label}{required ? '*' : ''}</span>
        <select
          className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3"
          value={current}
          onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {values.map(item => <option key={item.id} value={item.value}>{item.value}</option>)}
        </select>
      </label>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Edit DICOM device"
    >
      <section className="border-input bg-card max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-foreground text-xl font-semibold">Edit device</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Complete the physical-device details and configure optional C-ECHO checks.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {field('name', 'Device Name (Device AE Title)', true)}
          {catalogField('modality', 'Modality', 'MODALITY', true)}
          {catalogField('manufacturer', 'Manufacturer', 'MANUFACTURER')}
          {field('model', 'Model')}
          {field('serialNumber', 'Serial number')}
          {catalogField('department', 'Department', 'DEPARTMENT', true)}
          {field('location', 'Location', true)}
          <label className="text-foreground flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={event =>
                setForm(current => ({ ...current, isActive: event.target.checked }))
              }
            />{' '}
            Active device
          </label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void onSave({
                ...form,
                modality: empty(form.modality),
                manufacturer: empty(form.manufacturer),
                model: empty(form.model),
                serialNumber: empty(form.serialNumber),
                location: empty(form.location),
                department: empty(form.department),
                markReviewed: false,
              })
            }
          >
            Save draft
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void onSave({
                ...form,
                modality: empty(form.modality),
                manufacturer: empty(form.manufacturer),
                model: empty(form.model),
                serialNumber: empty(form.serialNumber),
                location: empty(form.location),
                department: empty(form.department),
                markReviewed: true,
              })
            }
          >
            Save and mark reviewed
          </Button>
        </div>

        <h3 className="text-foreground mt-7 font-semibold">AE titles and observed endpoints</h3>
        <div className="mt-3 space-y-3">
          {device.endpoints.map(endpoint => {
            let host = endpoint.dicomHost ?? endpoint.sourceIp ?? '';
            let port = endpoint.dicomPort?.toString() ?? '';
            let enabled = endpoint.cEchoEnabled;
            let tls = endpoint.useTls;
            return (
              <form
                key={endpoint.id}
                className="border-input/60 bg-background grid gap-3 rounded-lg border p-3 sm:grid-cols-5"
                onSubmit={event => {
                  event.preventDefault();
                  void onSaveEndpoint(endpoint.id, host, port, enabled, tls);
                }}
              >
                <div className="text-sm">
                  <span className="text-muted-foreground block text-xs">AE title</span>
                  <strong className="text-foreground">
                    {endpoint.aeTitle ?? 'Not identified'}
                  </strong>
                  <span className="text-muted-foreground block text-xs">
                    Observed IP: {endpoint.sourceIp ?? 'Unknown'}
                  </span>
                </div>
                <Input
                  aria-label="DICOM host"
                  defaultValue={host}
                  placeholder="Host / IP"
                  onChange={event => {
                    host = event.target.value;
                  }}
                />
                <Input
                  aria-label="DICOM port"
                  type="number"
                  min="1"
                  max="65535"
                  defaultValue={port}
                  placeholder="Port"
                  onChange={event => {
                    port = event.target.value;
                  }}
                />
                <div className="space-y-1 text-xs">
                  <label className="flex gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={enabled}
                      onChange={event => {
                        enabled = event.target.checked;
                      }}
                    />{' '}
                    Enable C-ECHO
                  </label>
                  <label className="flex gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={tls}
                      onChange={event => {
                        tls = event.target.checked;
                      }}
                    />{' '}
                    TLS
                  </label>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                >
                  Save endpoint
                </Button>
              </form>
            );
          })}
        </div>

        {devices.length > 1 && (
          <div className="border-input/60 mt-6 border-t pt-5">
            <h3 className="text-foreground font-semibold">Group with another physical device</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Moves every AE title above into the selected device and removes this duplicate record.
            </p>
            <div className="mt-3 flex gap-2">
              <select
                className="border-input bg-background text-foreground min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
                value={mergeTarget}
                onChange={event => setMergeTarget(event.target.value)}
              >
                <option value="">Select target device</option>
                {devices
                  .filter(value => value.id !== device.id)
                  .map(value => (
                    <option
                      key={value.id}
                      value={value.id}
                    >
                      {value.name}
                    </option>
                  ))}
              </select>
              <Button
                type="button"
                variant="outline"
                disabled={busy || !mergeTarget}
                onClick={() => void onMerge(mergeTarget)}
              >
                Merge
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function DeviceInventoryAdministration() {
  const { services, demoRole } = useDashboardContext();
  const [devices, setDevices] = useState<DicomDevice[]>([]);
  const [catalogValues, setCatalogValues] = useState<DeviceCatalogValue[]>([]);
  const [selected, setSelected] = useState<DicomDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowed = demoRole === 'PACS_ADMIN';
  const load = useCallback(async () => {
    if (!services || !allowed) return;
    setLoading(true);
    try {
      const [loadedDevices, loadedCatalog] = await Promise.all([
        services.deviceInventory.getDevices(),
        services.deviceInventory.getCatalogValues(),
      ]);
      setDevices(loadedDevices);
      setCatalogValues(loadedCatalog);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Device inventory could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [allowed, services]);
  useEffect(() => {
    void load();
  }, [load]);
  const reviewCount = useMemo(() => devices.filter(device => device.needsReview).length, [devices]);

  const perform = async (action: () => Promise<DicomDevice>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      await load();
      setSelected(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The device could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  if (!allowed)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <section className="border-destructive/40 bg-destructive/10 rounded-xl border p-8 text-center">
          <h1 className="text-foreground text-xl font-semibold">
            PACS administrator access required
          </h1>
        </section>
      </div>
    );
  return (
    <div className="mx-auto max-w-[1700px] space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Device Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            DICOM senders are registered automatically from connection, association, and
            image-transfer activity.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <section className="border-input bg-card rounded-xl border p-4">
          <span className="text-muted-foreground text-xs uppercase">Physical devices</span>
          <strong className="text-foreground mt-1 block text-2xl">{devices.length}</strong>
        </section>
        <section className="border-input bg-card rounded-xl border p-4">
          <span className="text-muted-foreground text-xs uppercase">AE titles</span>
          <strong className="text-foreground mt-1 block text-2xl">
            {devices.reduce((sum, device) => sum + device.endpoints.length, 0)}
          </strong>
        </section>
        <section
          className={`${reviewCount ? 'border-amber-400/40 bg-amber-400/10' : 'border-input bg-card'} rounded-xl border p-4`}
        >
          <span className="text-muted-foreground text-xs uppercase">Needs review</span>
          <strong className="text-foreground mt-1 block text-2xl">{reviewCount}</strong>
        </section>
      </div>
      {error && (
        <section
          role="alert"
          className="border-destructive/50 bg-destructive/10 rounded-lg border p-4 text-sm"
        >
          <p className="text-foreground">{error}</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => void load()}
          >
            Try again
          </Button>
        </section>
      )}
      {loading && !devices.length ? (
        <DashboardLoadingSkeleton label="Loading DICOM device inventory" />
      ) : devices.length === 0 ? (
        <section className="border-input bg-card rounded-xl border p-10 text-center">
          <h2 className="text-foreground font-semibold">No DICOM senders observed yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            A device will appear after its first connection attempt, association attempt, failed
            transfer, or successful image transfer.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {devices.map(device => (
            <section
              key={device.id}
              className="border-input bg-card rounded-xl border p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-foreground font-semibold">{device.name}</h2>
                    {device.needsReview && (
                      <span className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-500">
                        Needs review
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {device.modality ?? 'Modality not set'} ·{' '}
                    {device.department ?? 'Department not set'} ·{' '}
                    {device.location ?? 'Location not set'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(device)}
                >
                  Edit
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {device.endpoints.map(endpoint => (
                  <div
                    key={endpoint.id}
                    className="border-input/50 bg-background rounded-lg border p-3 text-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong className="text-foreground">
                        {endpoint.aeTitle ?? 'Unidentified AE title'}
                      </strong>
                      <span className="text-muted-foreground text-xs">
                        {endpoint.lastEventType.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Source: {endpoint.sourceIp ?? 'Unknown'} · Last observed{' '}
                      {formatKampalaDateTime(endpoint.lastObservedAt)}
                    </p>
                    {endpoint.lastFailureStatus && (
                      <p className="mt-1 text-xs text-red-400">
                        Last failure: {endpoint.lastFailureStatus}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {selected && (
        <DeviceEditor
          device={selected}
          devices={devices}
          busy={busy}
          catalogValues={catalogValues}
          onClose={() => setSelected(null)}
          onSave={input =>
            perform(() => services!.deviceInventory.updateDevice(selected.id, input))
          }
          onSaveEndpoint={(endpointId, host, port, enabled, tls) =>
            perform(() =>
              services!.deviceInventory.updateEndpoint(selected.id, endpointId, {
                dicomHost: empty(host),
                dicomPort: port ? Number(port) : null,
                cEchoEnabled: enabled,
                useTls: tls,
              })
            )
          }
          onMerge={targetId =>
            perform(() => services!.deviceInventory.mergeDevice(selected.id, targetId)).then(() =>
              setSelected(null)
            )
          }
        />
      )}
    </div>
  );
}
