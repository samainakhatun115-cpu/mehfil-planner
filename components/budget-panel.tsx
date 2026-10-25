"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  budgetSnapshot,
  formatInr,
  type BudgetLine,
} from "@/lib/plan"

export function BudgetPanel({
  lines,
  capInr,
  disabled,
  onChange,
}: {
  lines: BudgetLine[]
  capInr: number
  disabled: boolean
  onChange: (id: string, estimateInr: number) => void
}) {
  const snapshot = budgetSnapshot(lines, capInr)
  const meterMax = Math.max(snapshot.capInr, snapshot.plannedInr, 1)

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium">
            Planned {formatInr(snapshot.plannedInr)}
            <span className="font-normal text-muted-foreground">
              {" "}
              of {formatInr(snapshot.capInr)}
            </span>
          </p>
          <p className={snapshot.overBudget ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
            {snapshot.overBudget
              ? `${formatInr(snapshot.overByInr)} over budget`
              : `${formatInr(snapshot.remainingInr)} still open`}
          </p>
        </div>
        <div
          role="meter"
          aria-label="Planned spend versus budget"
          aria-valuemin={0}
          aria-valuemax={meterMax}
          aria-valuenow={snapshot.plannedInr}
          aria-valuetext={`${formatInr(snapshot.plannedInr)} planned of ${formatInr(snapshot.capInr)}`}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={snapshot.overBudget ? "h-full bg-destructive" : "h-full bg-primary"}
            style={{ width: `${Math.min(snapshot.percent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Every amount is an estimate, not a confirmed vendor price.
        </p>
      </div>
      <ul className="grid gap-3">
        {lines.map((line) => (
          <li key={line.id} className="grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-[1fr_9rem] sm:items-end">
            <div>
              <p className="font-medium">{line.category}</p>
              <p className="text-sm text-muted-foreground">{line.note}</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`budget-${line.id}`}>Estimate (₹)</Label>
              <Input
                id={`budget-${line.id}`}
                className="h-10"
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                disabled={disabled}
                value={line.estimateInr}
                onChange={(event) =>
                  onChange(
                    line.id,
                    event.target.value === "" ? 0 : Number(event.target.value),
                  )
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
