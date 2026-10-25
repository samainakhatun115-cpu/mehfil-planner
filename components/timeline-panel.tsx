"use client"

import { Badge } from "@/components/ui/badge"
import { PRIORITY_LABELS, type PlanTask } from "@/lib/plan"

export function TimelinePanel({
  tasks,
  disabled,
  onToggle,
}: {
  tasks: PlanTask[]
  disabled: boolean
  onToggle: (id: string, done: boolean) => void
}) {
  return (
    <ul className="grid gap-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--primary)]"
              checked={task.done}
              disabled={disabled}
              onChange={(event) => onToggle(task.id, event.target.checked)}
            />
            <span className="grid gap-1">
              <span className={task.done ? "font-medium line-through decoration-foreground/40" : "font-medium"}>
                {task.title}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <time dateTime={task.dueDate}>{formatDay(task.dueDate)}</time>
                <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  )
}

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
