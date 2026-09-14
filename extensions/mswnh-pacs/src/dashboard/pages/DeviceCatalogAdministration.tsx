import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { useDashboardContext } from '../context/DashboardProvider';
import type { DeviceCatalogCategory, DeviceCatalogValue } from '../models';

const categories: Array<{ id: DeviceCatalogCategory; label: string }> = [
  { id: 'MODALITY', label: 'Modalities' },
  { id: 'DEPARTMENT', label: 'Departments' },
  { id: 'MANUFACTURER', label: 'Manufacturers' },
];

function CatalogRow({ item, busy, onSave, onToggle }: {
  item: DeviceCatalogValue;
  busy: boolean;
  onSave: (item: DeviceCatalogValue, value: string) => void;
  onToggle: (item: DeviceCatalogValue) => void;
}) {
  const [value, setValue] = useState(item.value);
  useEffect(() => setValue(item.value), [item.value]);
  return (
    <div className="flex items-center gap-2">
      <Input value={value} disabled={!item.isActive || busy} onChange={event => setValue(event.target.value)} />
      <Button type="button" size="sm" variant="outline" disabled={busy || !item.isActive || !value.trim() || value.trim() === item.value}
        onClick={() => onSave(item, value.trim())}>Save</Button>
      <Button type="button" size="sm" variant="outline" disabled={busy}
        onClick={() => onToggle(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</Button>
    </div>
  );
}

export function DeviceCatalogAdministration() {
  const { services, demoRole } = useDashboardContext();
  const [items, setItems] = useState<DeviceCatalogValue[]>([]);
  const [drafts, setDrafts] = useState<Record<DeviceCatalogCategory, string>>({ MODALITY: '', DEPARTMENT: '', MANUFACTURER: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!services || demoRole !== 'PACS_ADMIN') return;
    try { setItems(await services.deviceInventory.getCatalogValues()); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Dropdown values could not be loaded.'); }
  }, [demoRole, services]);
  useEffect(() => { void load(); }, [load]);
  const perform = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await action(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The value could not be saved.'); }
    finally { setBusy(false); }
  };
  if (demoRole !== 'PACS_ADMIN') return <div className="p-6 text-center">PACS administrator access required.</div>;
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <div><h1 className="text-foreground text-2xl font-semibold">Device Dropdown Lists</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage the approved values used when completing DICOM device inventory records.</p></div>
      {error && <div role="alert" className="border-destructive/50 bg-destructive/10 rounded-lg border p-3 text-sm">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-3">
        {categories.map(category => (
          <section key={category.id} className="border-input bg-card rounded-xl border p-4">
            <h2 className="text-foreground font-semibold">{category.label}</h2>
            <form className="mt-3 flex gap-2" onSubmit={event => { event.preventDefault(); const value = drafts[category.id].trim(); if (!value) return;
              void perform(() => services!.deviceInventory.createCatalogValue({ category: category.id, value, isActive: true, sortOrder: 0 })).then(() => setDrafts(current => ({ ...current, [category.id]: '' }))); }}>
              <Input aria-label={`New ${category.label}`} placeholder="Add value" value={drafts[category.id]}
                onChange={event => setDrafts(current => ({ ...current, [category.id]: event.target.value }))} />
              <Button type="submit" size="sm" disabled={busy || !drafts[category.id].trim()}>Add</Button>
            </form>
            <div className="mt-4 space-y-2">
              {items.filter(item => item.category === category.id).map(item => (
                <CatalogRow key={item.id} item={item} busy={busy}
                  onSave={(current, value) => void perform(() => services!.deviceInventory.updateCatalogValue(current.id, { ...current, value }))}
                  onToggle={current => void perform(() => services!.deviceInventory.updateCatalogValue(current.id, { ...current, isActive: !current.isActive }))} />
              ))}
              {!items.some(item => item.category === category.id) && <p className="text-muted-foreground text-sm">No values configured.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
