"use client"

import type { ReactNode } from "react"
import { ChoiceField } from "@/components/choice-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DIET_LABELS,
  EVENT_LABELS,
  VENUE_LABELS,
  isoDateFromToday,
  type Brief,
  type Diet,
  type EventType,
  type FieldErrors,
  type VenueStyle,
} from "@/lib/plan"

export function exampleBrief(today = new Date()): Brief {
  return {
    eventType: "birthday",
    eventDate: isoDateFromToday(30, today),
    city: "Pune",
    guestCount: 30,
    budgetInr: 20000,
    diet: "vegetarian",
    venueStyle: "outdoor",
    wish: "I prefer an outdoor venue, simple decorations, vegetarian food, and a photography service.",
  }
}

export function BriefForm({
  brief,
  errors,
  disabled,
  onChange,
  onExample,
  onGenerate,
  onSample,
}: {
  brief: Brief
  errors: FieldErrors
  disabled: boolean
  onChange: (brief: Brief) => void
  onExample: () => void
  onGenerate: () => void
  onSample: () => void
}) {
  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    onChange({ ...brief, [key]: value })
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onGenerate()
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-medium">The brief</h2>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={onExample}
        >
          Use the birthday example
        </Button>
      </div>
      <ChoiceField
        id="event-type"
        label="Event"
        value={brief.eventType}
        items={EVENT_LABELS}
        disabled={disabled}
        onChange={(eventType: EventType) => update("eventType", eventType)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="event-date" label="Event date" error={errors.eventDate}>
          <Input
            id="event-date"
            type="date"
            className="h-10"
            value={brief.eventDate}
            disabled={disabled}
            aria-invalid={Boolean(errors.eventDate)}
            aria-describedby={errors.eventDate ? "event-date-error" : undefined}
            onChange={(event) => update("eventDate", event.target.value)}
          />
        </Field>
        <Field id="city" label="City" error={errors.city}>
          <Input
            id="city"
            className="h-10"
            value={brief.city}
            disabled={disabled}
            autoComplete="address-level2"
            placeholder="Pune"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "city-error" : undefined}
            onChange={(event) => update("city", event.target.value)}
          />
        </Field>
        <Field id="guests" label="Guests" error={errors.guestCount}>
          <Input
            id="guests"
            className="h-10"
            inputMode="numeric"
            type="number"
            min={1}
            max={5000}
            value={brief.guestCount || ""}
            disabled={disabled}
            aria-invalid={Boolean(errors.guestCount)}
            aria-describedby={errors.guestCount ? "guests-error" : undefined}
            onChange={(event) =>
              update("guestCount", event.target.value === "" ? 0 : Number(event.target.value))
            }
          />
        </Field>
        <Field id="budget" label="Budget (₹)" error={errors.budgetInr}>
          <Input
            id="budget"
            className="h-10"
            inputMode="numeric"
            type="number"
            min={500}
            step={100}
            value={brief.budgetInr || ""}
            disabled={disabled}
            aria-invalid={Boolean(errors.budgetInr)}
            aria-describedby={errors.budgetInr ? "budget-error" : undefined}
            onChange={(event) =>
              update("budgetInr", event.target.value === "" ? 0 : Number(event.target.value))
            }
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ChoiceField
          id="diet"
          label="Food"
          value={brief.diet}
          items={DIET_LABELS}
          disabled={disabled}
          onChange={(diet: Diet) => update("diet", diet)}
        />
        <ChoiceField
          id="venue"
          label="Setting"
          value={brief.venueStyle}
          items={VENUE_LABELS}
          disabled={disabled}
          onChange={(venueStyle: VenueStyle) => update("venueStyle", venueStyle)}
        />
      </div>
      <Field
        id="wish"
        label="What should the day feel like?"
        error={errors.wish}
        hint="Mention food, decor, photos, or anything you want the plan to respect."
      >
        <Textarea
          id="wish"
          className="min-h-24"
          value={brief.wish}
          disabled={disabled}
          maxLength={1000}
          aria-invalid={Boolean(errors.wish)}
          aria-describedby={errors.wish ? "wish-error" : "wish-hint"}
          onChange={(event) => update("wish", event.target.value)}
        />
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" className="h-10 px-4" disabled={disabled}>
          {disabled ? "Writing the plan…" : "Generate plan"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-10 px-4"
          disabled={disabled}
          onClick={onSample}
        >
          Preview a sample plan
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Sample plans are local estimates for layout review. They do not call Gemini and they are not confirmed prices.
      </p>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
