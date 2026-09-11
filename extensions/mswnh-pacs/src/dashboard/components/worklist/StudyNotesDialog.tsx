import React, { useEffect, useState } from 'react';
import { Button, Icons } from '@ohif/ui-next';

import type { Study, StudyNote } from '../../models';
import { formatKampalaDateTime } from '../../utils/formatDashboardDate';

export function StudyNotesDialog({
  study,
  busy,
  reviewBeforeLaunch = false,
  onAdd,
  onContinue,
  onClose,
}: {
  study: Study | null;
  busy: boolean;
  reviewBeforeLaunch?: boolean;
  onAdd: (input: Pick<StudyNote, 'type' | 'text' | 'popupOnOpen'>) => Promise<void>;
  onContinue?: () => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<StudyNote['type']>('GENERAL');
  const [text, setText] = useState('');
  const [popupOnOpen, setPopupOnOpen] = useState(false);
  useEffect(() => {
    setText('');
    setPopupOnOpen(false);
  }, [study?.id]);
  if (!study) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    await onAdd({ type, text: text.trim(), popupOnOpen });
    setText('');
    setPopupOnOpen(false);
  };

  return (
    <div
      className="bg-black/65 fixed inset-0 z-[110] grid place-items-center p-4"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Study notes for ${study.patient.name}`}
        className="bg-background border-input max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border shadow-2xl"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="border-input/60 flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Study notes</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {study.patient.name} · {study.examination}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Close notes"
            onClick={onClose}
          >
            <Icons.Close className="h-4 w-4" />
          </Button>
        </header>
        {reviewBeforeLaunch && (
          <div className="m-5 mb-0 rounded-lg border border-orange-400/40 bg-orange-400/10 p-3 text-sm text-orange-200">
            Review the flagged note before continuing to the image viewer.
          </div>
        )}
        <div className="space-y-3 p-5">
          {study.notes.map(note => (
            <article
              key={note.id}
              className={`rounded-lg border p-3 ${note.popupOnOpen ? 'border-orange-400/50 bg-orange-400/5' : 'border-input/60'}`}
            >
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <span className="text-primary font-semibold">
                  {note.type}
                  {note.popupOnOpen ? ' · POPUP ON OPEN' : ''}
                </span>
                <span className="text-muted-foreground">
                  {formatKampalaDateTime(note.createdAt)}
                </span>
              </div>
              <p className="text-foreground mt-2 text-sm leading-6">{note.text}</p>
              <p className="text-muted-foreground mt-2 text-xs">{note.createdBy}</p>
            </article>
          ))}
          {!study.notes.length && (
            <p className="text-muted-foreground py-3 text-center text-sm">
              No notes have been added.
            </p>
          )}
        </div>
        <form
          onSubmit={submit}
          className="border-input/60 bg-card space-y-3 border-t p-5"
        >
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <select
              value={type}
              onChange={event => setType(event.target.value as StudyNote['type'])}
              className="border-input bg-background text-foreground h-9 rounded-md border px-2 text-sm"
            >
              <option value="GENERAL">General</option>
              <option value="CLINICAL">Clinical</option>
              <option value="RADIOLOGY">Radiology</option>
              <option value="TECHNICAL">Technical</option>
              <option value="URGENT">Urgent</option>
            </select>
            <textarea
              value={text}
              onChange={event => setText(event.target.value)}
              placeholder="Add a study note"
              rows={3}
              className="border-input bg-background text-foreground focus:border-primary rounded-md border p-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-foreground flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={popupOnOpen}
                onChange={event => setPopupOnOpen(event.target.checked)}
              />{' '}
              Show when study opens
            </label>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={busy || !text.trim()}
              >
                Add note
              </Button>
              {reviewBeforeLaunch && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onContinue}
                >
                  Continue to viewer
                </Button>
              )}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
