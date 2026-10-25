"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Brief, type DayScheduleRow, parseIsoDate } from "@/lib/plan"

/** Format an ISO date string like "2026-11-24" to "24 Nov 2026" */
function formatEventDate(iso: string): string {
  const date = parseIsoDate(iso)
  if (!date) return iso
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Convert "HH:MM" (24h) to "H:MM AM/PM" */
function format12h(time: string): string {
  const [hStr, mStr] = time.split(":")
  const h = Number(hStr)
  const m = mStr ?? "00"
  if (!Number.isFinite(h)) return time
  const period = h < 12 ? "AM" : "PM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m} ${period}`
}

export function DayOfPanel({
  rows,
  brief,
  disabled,
  onChange,
}: {
  rows: DayScheduleRow[]
  brief: Brief
  disabled: boolean
  onChange: (id: string, patch: Partial<Pick<DayScheduleRow, "time" | "moment" | "note">>) => void
}) {
  return (
    <div className="grid gap-4">
      {/* Header metadata */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">Date:</span>{" "}
          <time dateTime={brief.eventDate}>{formatEventDate(brief.eventDate)}</time>
        </span>
        <span>
          <span className="font-medium text-foreground">Guests:</span> {brief.guestCount}
        </span>
        <span>
          <span className="font-medium text-foreground">City:</span> {brief.city}
        </span>
        <span>
          <span className="font-medium text-foreground">Setting:</span>{" "}
          {brief.venueStyle.charAt(0).toUpperCase() + brief.venueStyle.slice(1)}
        </span>
      </div>

      {/* Disclaimer */}
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
        Suggested schedule only — these are not confirmed bookings. Adjust the times to fit your
        actual plans.
      </p>

      {/* Schedule rows */}
      <ol className="grid gap-3" aria-label="Day-of schedule">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[7rem_1fr_2fr]"
          >
            {/* Time input */}
            <div className="grid gap-1">
              <Label htmlFor={`day-time-${row.id}`} className="text-xs text-muted-foreground">
                Time
              </Label>
              <Input
                id={`day-time-${row.id}`}
                type="time"
                className="h-9 font-mono text-sm"
                value={row.time}
                disabled={disabled}
                aria-label={`Time for step ${index + 1}`}
                onChange={(e) =>
                  onChange(row.id, { time: e.target.value || row.time })
                }
              />
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                {format12h(row.time)}
              </span>
            </div>

            {/* Moment */}
            <div className="grid gap-1">
              <Label htmlFor={`day-moment-${row.id}`} className="text-xs text-muted-foreground">
                Moment
              </Label>
              <Input
                id={`day-moment-${row.id}`}
                className="h-9 text-sm font-medium"
                value={row.moment}
                disabled={disabled}
                maxLength={120}
                aria-label={`Moment for step ${index + 1}`}
                onChange={(e) =>
                  onChange(row.id, { moment: e.target.value.slice(0, 120) })
                }
              />
            </div>

            {/* Note */}
            <div className="grid gap-1">
              <Label htmlFor={`day-note-${row.id}`} className="text-xs text-muted-foreground">
                Note
              </Label>
              <Input
                id={`day-note-${row.id}`}
                className="h-9 text-sm"
                value={row.note}
                disabled={disabled}
                maxLength={240}
                placeholder="Optional detail"
                aria-label={`Note for step ${index + 1}`}
                onChange={(e) =>
                  onChange(row.id, { note: e.target.value.slice(0, 240) })
                }
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
