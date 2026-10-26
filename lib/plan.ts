import {
  addDays,
  asRecord,
  cleanDate,
  cleanMoney,
  cleanText,
  isOneOf,
  makeId,
  parseIsoDate,
  sortTasks,
  startOfDay,
} from "@/lib/format"
import { buildDaySchedule } from "@/lib/sample-plan"
import {
  DIETS,
  EVENT_LABELS,
  EVENT_TYPES,
  LIMITS,
  PRIORITIES,
  VENUE_STYLES,
  type Brief,
  type BudgetLine,
  type DayScheduleRow,
  type Diet,
  type EventType,
  type FieldErrors,
  type Idea,
  type Plan,
  type PlanSource,
  type PlanTask,
  type VendorItem,
  type VenueStyle,
} from "@/lib/types"

export * from "@/lib/types"
export * from "@/lib/format"
export * from "@/lib/sample-plan"
export * from "@/lib/storage"

export function validateBrief(
  input: unknown,
  today = new Date(),
): { ok: true; brief: Brief } | { ok: false; errors: FieldErrors; message: string } {
  const record = asRecord(input)
  if (!record) {
    return {
      ok: false,
      errors: {},
      message: "The event brief needs to be an object.",
    }
  }

  const errors: FieldErrors = {}
  if (!isOneOf(record.eventType, EVENT_TYPES)) {
    errors.eventType = "Choose a wedding, birthday, or community gathering."
  }
  const eventDate = cleanText(record.eventDate, 10)
  const parsedDate = parseIsoDate(eventDate)
  if (!parsedDate) {
    errors.eventDate = "Use a real date."
  } else {
    const earliest = addDays(startOfDay(today), -365)
    const latest = addDays(startOfDay(today), 365 * 3)
    if (parsedDate < earliest || parsedDate > latest) {
      errors.eventDate = "Pick a date within the next three years."
    }
  }

  const city = cleanText(record.city, LIMITS.city)
  if (city.length < 2) errors.city = "Add the city or town."

  const guestCount = Number(record.guestCount)
  if (!Number.isInteger(guestCount) || guestCount < LIMITS.guestsMin) {
    errors.guestCount = "Add at least 1 guest."
  } else if (guestCount > LIMITS.guestsMax) {
    errors.guestCount = "Keep the guest count at 5,000 or below."
  }

  const budgetInr = Number(record.budgetInr)
  if (!Number.isFinite(budgetInr) || budgetInr < LIMITS.budgetMin) {
    errors.budgetInr = "Set a budget of at least ₹500."
  } else if (budgetInr > LIMITS.budgetMax) {
    errors.budgetInr = "That budget is too large for this planner."
  }

  if (!isOneOf(record.diet, DIETS)) errors.diet = "Choose a food preference."
  if (!isOneOf(record.venueStyle, VENUE_STYLES)) {
    errors.venueStyle = "Choose indoor or outdoor."
  }

  const wish = cleanText(record.wish, LIMITS.wish)
  if (typeof record.wish === "string" && record.wish.length > LIMITS.wish) {
    errors.wish = "Keep the note under 1,000 characters."
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: "Fix the highlighted fields before generating a plan.",
    }
  }

  return {
    ok: true,
    brief: {
      eventType: record.eventType as EventType,
      eventDate,
      city,
      guestCount,
      budgetInr: Math.round(budgetInr),
      diet: record.diet as Diet,
      venueStyle: record.venueStyle as VenueStyle,
      wish,
    },
  }
}

export function normalizeGeneratedPlan(
  raw: unknown,
  brief: Brief,
  source: PlanSource,
  nowIso: string,
  idFor: (kind: string) => string = makeId,
): Plan {
  const record = asRecord(raw)
  if (!record) throw new Error("EMPTY_PLAN")

  const seen = new Set<string>()
  const nextId = (kind: string, requested?: unknown) => {
    const candidate = cleanText(requested, 80)
    if (candidate && !seen.has(candidate)) {
      seen.add(candidate)
      return candidate
    }
    let id = idFor(kind)
    while (seen.has(id)) id = idFor(kind)
    seen.add(id)
    return id
  }

  const budgetLines = (Array.isArray(record.budgetLines) ? record.budgetLines : [])
    .slice(0, LIMITS.lists)
    .map((item): BudgetLine | null => {
      const line = asRecord(item)
      if (!line) return null
      const category = cleanText(line.category, 80)
      if (!category) return null
      return {
        id: nextId("budget", line.id),
        category,
        estimateInr: cleanMoney(line.estimateInr),
        note: cleanText(line.note, LIMITS.text) || "Estimate, not a confirmed price.",
        amountLocked: false,
      }
    })
    .filter((line): line is BudgetLine => line !== null)

  const tasks = sortTasks(
    (Array.isArray(record.tasks) ? record.tasks : [])
      .slice(0, LIMITS.lists)
      .map((item): PlanTask | null => {
        const task = asRecord(item)
        if (!task) return null
        const title = cleanText(task.title, 140)
        if (!title) return null
        const priority = isOneOf(task.priority, PRIORITIES) ? task.priority : "medium"
        return {
          id: nextId("task", task.id),
          title,
          dueDate: cleanDate(task.dueDate, brief.eventDate),
          priority,
          done: false,
          doneLocked: false,
        }
      })
      .filter((task): task is PlanTask => task !== null),
  )

  const vendors = (Array.isArray(record.vendors) ? record.vendors : [])
    .slice(0, LIMITS.lists)
    .map((item): VendorItem | null => {
      const vendor = asRecord(item)
      if (!vendor) return null
      const category = cleanText(vendor.category, 80)
      if (!category) return null
      return {
        id: nextId("vendor", vendor.id),
        category,
        why:
          cleanText(vendor.why, LIMITS.text) ||
          "A category to contact yourself. Not a real listing.",
        status: "pending",
        contactName: "",
        contactPhone: "",
        quoteInr: null,
        detailsLocked: false,
        userAdded: false,
      }
    })
    .filter((vendor): vendor is VendorItem => vendor !== null)

  const ideas = (Array.isArray(record.ideas) ? record.ideas : [])
    .slice(0, 8)
    .map((item): Idea | null => {
      const idea = asRecord(item)
      if (!idea) return null
      const title = cleanText(idea.title, 80)
      const detail = cleanText(idea.detail, LIMITS.text)
      if (!title || !detail) return null
      return { id: nextId("idea", idea.id), title, detail }
    })
    .filter((idea): idea is Idea => idea !== null)

  if (
    budgetLines.length === 0 ||
    tasks.length === 0 ||
    vendors.length === 0 ||
    ideas.length === 0
  ) {
    throw new Error("EMPTY_PLAN")
  }

  const summary =
    cleanText(record.summary, LIMITS.summary) ||
    `A ${EVENT_LABELS[brief.eventType].toLowerCase()} plan for ${brief.guestCount} guests in ${brief.city}.`

  const rawSchedule = Array.isArray(record.daySchedule) ? record.daySchedule : []
  const parsedSchedule = rawSchedule
    .slice(0, 10)
    .map((item): DayScheduleRow | null => {
      const row = asRecord(item)
      if (!row) return null
      const moment = cleanText(row.moment, 120)
      if (!moment) return null
      const rawTime = cleanText(row.time, 5)
      const time = /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : "12:00"
      return {
        id: nextId("day", row.id),
        time,
        moment,
        note: cleanText(row.note, LIMITS.text),
        locked: false,
      }
    })
    .filter((row): row is DayScheduleRow => row !== null)

  const daySchedule =
    parsedSchedule.length > 0 ? parsedSchedule : buildDaySchedule(brief, idFor)

  return {
    id: nextId("plan", record.id),
    brief,
    summary,
    budgetLines,
    tasks,
    vendors,
    ideas,
    daySchedule,
    source,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

function sameKey(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function mergeRefinement(
  previous: Plan,
  incoming: Plan,
  nowIso: string,
  brief: Brief = previous.brief,
): Plan {
  return {
    ...previous,
    brief,
    summary: incoming.summary.trim() || previous.summary,
    budgetLines: mergeBudget(previous.budgetLines, incoming.budgetLines),
    tasks: sortTasks(mergeTasks(previous.tasks, incoming.tasks)),
    vendors: mergeVendors(previous.vendors, incoming.vendors),
    ideas: incoming.ideas.length > 0 ? incoming.ideas : previous.ideas,
    daySchedule: mergeDaySchedule(previous.daySchedule, incoming.daySchedule),
    source: incoming.source === "gemini" ? "gemini" : previous.source,
    updatedAt: nowIso,
  }
}

function mergeDaySchedule(
  previous: DayScheduleRow[],
  incoming: DayScheduleRow[],
): DayScheduleRow[] {
  if (incoming.length === 0) return previous
  const locked = previous.filter((row) => row.locked)
  const lockedMoments = new Set(locked.map((row) => row.moment.trim().toLowerCase()))
  const fresh = incoming.filter(
    (row) => !lockedMoments.has(row.moment.trim().toLowerCase()),
  )
  return [...locked, ...fresh]
}

function mergeBudget(previous: BudgetLine[], incoming: BudgetLine[]): BudgetLine[] {
  if (incoming.length === 0) return previous
  const used = new Set<string>()
  const kept: BudgetLine[] = []
  for (const line of previous) {
    if (!line.amountLocked) continue
    const match = incoming.find(
      (item) =>
        !used.has(item.id) &&
        (item.id === line.id || sameKey(item.category, line.category)),
    )
    for (const item of incoming) {
      if (item.id === line.id || sameKey(item.category, line.category)) {
        used.add(item.id)
      }
    }
    kept.push({
      ...(match ?? line),
      id: line.id,
      category: line.category,
      estimateInr: line.estimateInr,
      amountLocked: true,
    })
  }
  const fresh = incoming
    .filter((item) => !used.has(item.id))
    .map((item) => ({ ...item, amountLocked: false }))
  return [...kept, ...fresh]
}

function mergeTasks(previous: PlanTask[], incoming: PlanTask[]): PlanTask[] {
  if (incoming.length === 0) return previous
  const used = new Set<string>()
  const kept: PlanTask[] = []
  for (const task of previous) {
    if (!task.doneLocked) continue
    const match = incoming.find(
      (item) => item.id === task.id || sameKey(item.title, task.title),
    )
    for (const item of incoming) {
      if (item.id === task.id || sameKey(item.title, task.title)) used.add(item.id)
    }
    kept.push({
      ...(match ?? task),
      id: task.id,
      title: task.title,
      done: task.done,
      doneLocked: true,
    })
  }
  const fresh = incoming
    .filter((item) => !used.has(item.id))
    .map((item) => ({ ...item, done: false, doneLocked: false }))
  return [...kept, ...fresh]
}

function mergeVendors(previous: VendorItem[], incoming: VendorItem[]): VendorItem[] {
  if (incoming.length === 0) return previous
  const used = new Set<string>()
  const kept: VendorItem[] = []
  for (const vendor of previous) {
    if (!vendor.detailsLocked && !vendor.userAdded) continue
    const match = incoming.find(
      (item) => item.id === vendor.id || sameKey(item.category, vendor.category),
    )
    for (const item of incoming) {
      if (item.id === vendor.id || sameKey(item.category, vendor.category)) {
        used.add(item.id)
      }
    }
    kept.push({
      ...(match ?? vendor),
      id: vendor.id,
      category: vendor.category,
      why: match?.why || vendor.why,
      status: vendor.status,
      contactName: vendor.contactName,
      contactPhone: vendor.contactPhone,
      quoteInr: vendor.quoteInr,
      detailsLocked: true,
      userAdded: vendor.userAdded,
    })
  }
  const fresh = incoming
    .filter((item) => !used.has(item.id))
    .map((item) => ({
      ...item,
      status: "pending" as const,
      contactName: "",
      contactPhone: "",
      quoteInr: null,
      detailsLocked: false,
      userAdded: false,
    }))
  return [...kept, ...fresh]
}

export function blankVendor(idFor: (kind: string) => string = makeId): VendorItem {
  return {
    id: idFor("extra-vendor"),
    category: "Extra vendor",
    why: "Added by you. Type the real contact.",
    status: "pending",
    contactName: "",
    contactPhone: "",
    quoteInr: null,
    detailsLocked: true,
    userAdded: true,
  }
}
