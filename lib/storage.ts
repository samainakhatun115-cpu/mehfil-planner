import {
  asRecord,
  cleanMoney,
  cleanText,
  isOneOf,
  parseIsoDate,
  sortTasks,
} from "@/lib/format"
import { normalizeGeneratedPlan, validateBrief } from "@/lib/plan"
import {
  DIETS,
  EVENT_TYPES,
  LIMITS,
  VENDOR_STATUSES,
  VENUE_STYLES,
  type Brief,
  type DayScheduleRow,
  type FieldErrors,
  type Plan,
} from "@/lib/types"

function parseBriefLoose(input: unknown): Brief | null {
  const record = asRecord(input)
  if (!record) return null
  if (!isOneOf(record.eventType, EVENT_TYPES)) return null
  if (!isOneOf(record.diet, DIETS)) return null
  if (!isOneOf(record.venueStyle, VENUE_STYLES)) return null
  const eventDate = cleanText(record.eventDate, 10)
  if (!parseIsoDate(eventDate)) return null
  const city = cleanText(record.city, LIMITS.city)
  if (city.length < 2) return null
  const guestCount = Number(record.guestCount)
  const budgetInr = Number(record.budgetInr)
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > LIMITS.guestsMax) {
    return null
  }
  if (!Number.isFinite(budgetInr) || budgetInr < 0 || budgetInr > LIMITS.budgetMax) {
    return null
  }
  return {
    eventType: record.eventType,
    eventDate,
    city,
    guestCount,
    budgetInr: Math.round(budgetInr),
    diet: record.diet,
    venueStyle: record.venueStyle,
    wish: cleanText(record.wish, LIMITS.wish),
  }
}

export function parseStoredPlan(value: unknown): Plan | null {
  const record = asRecord(value)
  if (!record) return null
  const brief = parseBriefLoose(record.brief)
  if (!brief) return null
  if (record.source !== "gemini" && record.source !== "sample") return null
  if (!Array.isArray(record.budgetLines) || !Array.isArray(record.tasks)) return null
  if (!Array.isArray(record.vendors) || !Array.isArray(record.ideas)) return null

  try {
    const normalized = normalizeGeneratedPlan(
      record,
      brief,
      record.source,
      cleanText(record.updatedAt, 40) || new Date().toISOString(),
    )
    const previousLines = new Map(
      record.budgetLines.map((item) => {
        const line = asRecord(item)
        return [cleanText(line?.id, 80), line] as const
      }),
    )
    const budgetLines = normalized.budgetLines.map((line) => {
      const previous = previousLines.get(line.id)
      return {
        ...line,
        amountLocked: previous?.amountLocked === true,
        estimateInr:
          previous?.amountLocked === true
            ? cleanMoney(previous.estimateInr)
            : line.estimateInr,
      }
    })
    const previousTasks = new Map(
      record.tasks.map((item) => {
        const task = asRecord(item)
        return [cleanText(task?.id, 80), task] as const
      }),
    )
    const tasks = normalized.tasks.map((task) => {
      const previous = previousTasks.get(task.id)
      const done = previous?.done === true
      return {
        ...task,
        done,
        doneLocked: previous?.doneLocked === true || done,
      }
    })
    const previousVendors = new Map(
      record.vendors.map((item) => {
        const vendor = asRecord(item)
        return [cleanText(vendor?.id, 80), vendor] as const
      }),
    )
    const vendors = normalized.vendors.map((vendor) => {
      const previous = previousVendors.get(vendor.id)
      if (!previous) return vendor
      const status = isOneOf(previous.status, VENDOR_STATUSES)
        ? previous.status
        : "pending"
      return {
        ...vendor,
        status,
        contactName: cleanText(previous.contactName, 80),
        contactPhone: cleanText(previous.contactPhone, 20).replace(/[^\d+\-() ]/g, ""),
        quoteInr:
          previous.quoteInr === null || previous.quoteInr === undefined
            ? null
            : cleanMoney(previous.quoteInr),
        detailsLocked: previous.detailsLocked === true,
        userAdded: previous.userAdded === true,
        why: cleanText(previous.why, LIMITS.text) || vendor.why,
      }
    })
    const previousSchedule = new Map(
      (Array.isArray(record.daySchedule) ? record.daySchedule : []).map((item) => {
        const row = asRecord(item)
        return [cleanText(row?.id, 80), row] as const
      }),
    )
    const daySchedule: DayScheduleRow[] = normalized.daySchedule.map((row) => {
      const previous = previousSchedule.get(row.id)
      if (!previous || previous.locked !== true) return row
      return {
        ...row,
        time: /^\d{2}:\d{2}$/.test(cleanText(previous.time, 5))
          ? cleanText(previous.time, 5)
          : row.time,
        moment: cleanText(previous.moment, 120) || row.moment,
        note: cleanText(previous.note, LIMITS.text) || row.note,
        locked: true,
      }
    })

    return {
      ...normalized,
      id: cleanText(record.id, 80) || normalized.id,
      budgetLines,
      tasks: sortTasks(tasks),
      vendors,
      daySchedule,
      createdAt: cleanText(record.createdAt, 40) || normalized.createdAt,
      updatedAt: cleanText(record.updatedAt, 40) || normalized.updatedAt,
    }
  } catch {
    return null
  }
}

export function parsePlanRequest(
  body: unknown,
  today = new Date(),
):
  | {
      ok: true
      brief: Brief
      followUp: string
      currentPlan: Plan | null
    }
  | { ok: false; message: string; errors: FieldErrors } {
  const record = asRecord(body)
  if (!record) {
    return {
      ok: false,
      message: "Send a JSON object with the event brief.",
      errors: {},
    }
  }
  const briefResult = validateBrief(record.brief, today)
  if (!briefResult.ok) return briefResult

  const followUp = cleanText(record.followUp, LIMITS.followUp)
  if (typeof record.followUp === "string" && record.followUp.trim().length > LIMITS.followUp) {
    return {
      ok: false,
      message: "Keep the refine note under 500 characters.",
      errors: { followUp: "Keep the refine note under 500 characters." },
    }
  }

  let currentPlan: Plan | null = null
  if (record.currentPlan !== undefined && record.currentPlan !== null) {
    currentPlan = parseStoredPlan(record.currentPlan)
    if (!currentPlan) {
      return {
        ok: false,
        message: "The saved plan could not be read. Generate a fresh plan.",
        errors: {},
      }
    }
  }
  if (followUp && !currentPlan) {
    return {
      ok: false,
      message: "Generate a plan before you refine it.",
      errors: { followUp: "Generate a plan first." },
    }
  }

  return { ok: true, brief: briefResult.brief, followUp, currentPlan }
}

export function planForPrompt(plan: Plan) {
  return {
    summary: plan.summary,
    budgetLines: plan.budgetLines.map((line) => ({
      id: line.id,
      category: line.category,
      estimateInr: line.estimateInr,
      note: line.note,
      amountLocked: line.amountLocked,
    })),
    tasks: plan.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      done: task.done,
      doneLocked: task.doneLocked,
    })),
    vendors: plan.vendors.map((vendor) => ({
      id: vendor.id,
      category: vendor.category,
      why: vendor.why,
      detailsLocked: vendor.detailsLocked,
    })),
    ideas: plan.ideas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      detail: idea.detail,
    })),
    daySchedule: plan.daySchedule.map((row) => ({
      id: row.id,
      time: row.time,
      moment: row.moment,
      note: row.note,
    })),
  }
}
