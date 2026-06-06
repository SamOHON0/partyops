'use client'

import { useState } from 'react'
import type { BookingQuestion, BookingQuestionType } from '@/lib/types'

type Row = BookingQuestion

let idCounter = 0
function newId() {
  idCounter += 1
  return `q_${Date.now()}_${idCounter}`
}

export default function BookingFlowEditor({
  action,
  initial,
}: {
  action: (formData: FormData) => void
  initial: BookingQuestion[]
}) {
  const [rows, setRows] = useState<Row[]>(initial)

  function add(type: BookingQuestionType) {
    setRows((r) => [
      ...r,
      { id: newId(), label: '', type, required: false },
    ])
  }
  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i))
  }
  function move(i: number, dir: -1 | 1) {
    setRows((r) => {
      const j = i + dir
      if (j < 0 || j >= r.length) return r
      const copy = r.slice()
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <section className="po-card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">Your questions</h2>
        <p className="mb-4 text-xs text-ink-500">
          Short text questions capture an answer (e.g. delivery area, where it will be set up,
          occasion). Confirmations are a required tick (e.g. &quot;I understand bookings need
          2 days&apos; notice in busy season&quot;).
        </p>

        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
            No custom questions yet. Add one below.
          </p>
        )}

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.id} className="rounded-xl border border-ink-200 p-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="text-ink-400 hover:text-ink-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === rows.length - 1}
                    className="text-ink-400 hover:text-ink-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    value={row.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    placeholder={
                      row.type === 'checkbox'
                        ? 'Confirmation text the customer must tick'
                        : 'Question label (e.g. Where will it be set up?)'
                    }
                    className="po-input"
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium">
                      {row.type === 'checkbox' ? 'Confirmation' : 'Short text'}
                    </span>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.required}
                        onChange={(e) => update(i, { required: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="ml-auto text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => add('text')} className="po-btn po-btn-secondary">
            + Add text question
          </button>
          <button type="button" onClick={() => add('checkbox')} className="po-btn po-btn-secondary">
            + Add confirmation
          </button>
        </div>
      </section>

      <input type="hidden" name="questions" value={JSON.stringify(rows)} />

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
        <button type="submit" className="po-btn po-btn-primary">
          Save booking flow
        </button>
      </div>
    </form>
  )
}
