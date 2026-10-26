import {
  LIMITS,
  type BudgetLine,
  type BudgetSnapshot,
  type PlanTask,
  type Priority,
} from "@/lib/types"

const priorityRank: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function makeId(kind: string): string {
  const rand =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${kind}_${rand}`
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function isoDateFromToday(daysAhead: number, today = new Date()): string {
  return formatIsoDate(addDays(startOfDay(today), daysAhead))
}

export function daysUntil(eventDate: string, today = new Date()): number | null {
  const event = parseIsoDate(eventDate)
  if (!event) return null
  const diff = event.getTime() - startOfDay(today).getTime()
  return Math.round(diff / 86_400_000)
}

export function countdownLabel(eventDate: string, today = new Date()): string {
  const days = daysUntil(eventDate, today)
  if (days === null) return "Set an event date"
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days > 1) return `In ${days} days`
  if (days === -1) return "Yesterday"
  return `${Math.abs(days)} days ago`
}

export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && options.includes(value as T)
}

export function cleanMoney(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(amount) || amount < 0) return 0
  return Math.round(Math.min(amount, LIMITS.budgetMax))
}

export function cleanDate(value: unknown, fallback: string): string {
  const text = cleanText(value, 10)
  return parseIsoDate(text) ? text : fallback
}

export function budgetTotal(lines: Pick<BudgetLine, "estimateInr">[]): number {
  return lines.reduce((sum, line) => {
    const amount = Number(line.estimateInr)
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)
}

export function budgetSnapshot(
  lines: Pick<BudgetLine, "estimateInr">[],
  capInr: number,
): BudgetSnapshot {
  const plannedInr = budgetTotal(lines)
  const cap = Number.isFinite(capInr) ? capInr : 0
  const remainingInr = cap - plannedInr
  const overBudget = plannedInr > cap
  return {
    plannedInr,
    capInr: cap,
    remainingInr,
    overByInr: overBudget ? plannedInr - cap : 0,
    overBudget,
    percent: cap > 0 ? (plannedInr / cap) * 100 : 0,
  }
}

export function sortTasks<T extends Pick<PlanTask, "dueDate" | "priority">>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    const byDate = a.dueDate.localeCompare(b.dueDate)
    if (byDate !== 0) return byDate
    return priorityRank[a.priority] - priorityRank[b.priority]
  })
}
