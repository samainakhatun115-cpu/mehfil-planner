export const EVENT_TYPES = ["wedding", "birthday", "community"] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const DIETS = [
  "vegetarian",
  "eggetarian",
  "non-vegetarian",
  "vegan",
  "mixed",
] as const
export type Diet = (typeof DIETS)[number]

export const VENUE_STYLES = ["indoor", "outdoor"] as const
export type VenueStyle = (typeof VENUE_STYLES)[number]

export const VENDOR_STATUSES = ["pending", "quoted", "confirmed"] as const
export type VendorStatus = (typeof VENDOR_STATUSES)[number]

export const PRIORITIES = ["high", "medium", "low"] as const
export type Priority = (typeof PRIORITIES)[number]

export const EVENT_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  community: "Community gathering",
}

export const DIET_LABELS: Record<Diet, string> = {
  vegetarian: "Vegetarian",
  eggetarian: "Eggetarian",
  "non-vegetarian": "Non-vegetarian",
  vegan: "Vegan",
  mixed: "Mixed",
}

export const VENUE_LABELS: Record<VenueStyle, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
}

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  pending: "Pending",
  quoted: "Quoted",
  confirmed: "Confirmed",
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

export interface Brief {
  eventType: EventType
  eventDate: string
  city: string
  guestCount: number
  budgetInr: number
  diet: Diet
  venueStyle: VenueStyle
  wish: string
}

export interface BudgetLine {
  id: string
  category: string
  estimateInr: number
  note: string
  amountLocked: boolean
}

export interface PlanTask {
  id: string
  title: string
  dueDate: string
  priority: Priority
  done: boolean
  doneLocked: boolean
}

export interface VendorItem {
  id: string
  category: string
  why: string
  status: VendorStatus
  contactName: string
  contactPhone: string
  quoteInr: number | null
  detailsLocked: boolean
  userAdded: boolean
}

export interface Idea {
  id: string
  title: string
  detail: string
}

export type PlanSource = "gemini" | "sample"

export interface Plan {
  id: string
  brief: Brief
  summary: string
  budgetLines: BudgetLine[]
  tasks: PlanTask[]
  vendors: VendorItem[]
  ideas: Idea[]
  source: PlanSource
  createdAt: string
  updatedAt: string
}

export type FieldErrors = Partial<Record<keyof Brief | "followUp", string>>

export interface BudgetSnapshot {
  plannedInr: number
  capInr: number
  remainingInr: number
  overByInr: number
  overBudget: boolean
  percent: number
}

const LIMITS = {
  city: 80,
  wish: 1000,
  followUp: 500,
  guestsMin: 1,
  guestsMax: 5000,
  budgetMin: 500,
  budgetMax: 50_000_000,
  text: 240,
  summary: 500,
  lists: 16,
}

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

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && options.includes(value as T)
}

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

interface Share {
  category: string
  note: string
  share: number
}

function sharesFor(brief: Brief): Share[] {
  const foodNote = `${DIET_LABELS[brief.diet]} food for about ${brief.guestCount} guests. Estimate, not a quote.`
  if (brief.eventType === "wedding") {
    return [
      { category: "Venue", note: "Booking hold and backup room. Estimate, not a quote.", share: 25 },
      { category: "Catering", note: foodNote, share: 30 },
      { category: "Decor", note: "Flowers, fabric, and lighting. Estimate, not a quote.", share: 15 },
      { category: "Photography", note: "Coverage length is still your choice. Estimate, not a quote.", share: 12 },
      { category: "Entertainment", note: "Music or a small program. Estimate, not a quote.", share: 8 },
      { category: "Invitations", note: "Cards or a simple digital invite. Estimate, not a quote.", share: 5 },
      { category: "Miscellaneous", note: "Transport, tips, and last-minute gaps. Estimate, not a quote.", share: 5 },
    ]
  }
  if (brief.eventType === "community") {
    return [
      { category: "Venue", note: "Hall, park permission, or a borrowed room. Estimate, not a quote.", share: 20 },
      { category: "Food and water", note: foodNote, share: 30 },
      { category: "Equipment", note: "Sound, chairs, or a projector. Estimate, not a quote.", share: 15 },
      { category: "Decor", note: "A welcome board and simple markers. Estimate, not a quote.", share: 10 },
      { category: "Volunteers", note: "Tea, badges, and a small thank-you. Estimate, not a quote.", share: 10 },
      { category: "Invitations", note: "A message people can forward. Estimate, not a quote.", share: 5 },
      { category: "Transport", note: "Getting materials to the site. Estimate, not a quote.", share: 10 },
    ]
  }
  return [
    { category: "Place", note: `${VENUE_LABELS[brief.venueStyle]} setup. Estimate, not a quote.`, share: 15 },
    { category: "Food", note: foodNote, share: 40 },
    { category: "Decor", note: "Simple decorations only. Estimate, not a quote.", share: 15 },
    { category: "Photography", note: "A short session, not a full crew. Estimate, not a quote.", share: 12 },
    { category: "Cake and entertainment", note: "Cake plus one small activity. Estimate, not a quote.", share: 10 },
    { category: "Invitations", note: "Messages or a few printed cards. Estimate, not a quote.", share: 4 },
    { category: "Miscellaneous", note: "Transport and a spare cushion in the budget. Estimate, not a quote.", share: 4 },
  ]
}

export function allocateBudget(
  totalInr: number,
  shares: Share[],
  idFor: (kind: string) => string,
): BudgetLine[] {
  const total = Math.max(0, Math.round(totalInr))
  const amounts = shares.map((share) => Math.round((total * share.share) / 100))
  const drift = total - amounts.reduce((sum, amount) => sum + amount, 0)
  if (amounts.length > 0) amounts[amounts.length - 1] += drift
  if (amounts.some((amount) => amount < 0)) {
    const deficit = amounts.reduce(
      (sum, amount) => sum + (amount < 0 ? -amount : 0),
      0,
    )
    for (let index = 0; index < amounts.length; index += 1) {
      if (amounts[index] < 0) amounts[index] = 0
    }
    const largest = amounts.indexOf(Math.max(...amounts))
    if (largest >= 0) amounts[largest] = Math.max(0, amounts[largest] - deficit)
  }
  return shares.map((share, index) => ({
    id: idFor(`budget-${share.category}`),
    category: share.category,
    estimateInr: amounts[index] ?? 0,
    note: share.note,
    amountLocked: false,
  }))
}

function dueDateFor(eventDate: string, daysBefore: number, today: Date): string {
  const event = parseIsoDate(eventDate)
  if (!event) return eventDate
  const target = addDays(event, -daysBefore)
  const todayStart = startOfDay(today)
  if (event < todayStart) return formatIsoDate(target)
  if (target < todayStart) return formatIsoDate(todayStart)
  return formatIsoDate(target)
}

function taskTemplates(brief: Brief): Array<{
  title: string
  daysBefore: number
  priority: Priority
}> {
  if (brief.eventType === "wedding") {
    return [
      { title: "Shortlist the venue and one backup", daysBefore: 21, priority: "high" },
      { title: "Confirm food and a menu that matches the diet", daysBefore: 14, priority: "high" },
      { title: "Send invitations with time and place", daysBefore: 7, priority: "medium" },
      { title: "Confirm decor and how long photos will run", daysBefore: 3, priority: "medium" },
      { title: "Write the day-of running order", daysBefore: 0, priority: "high" },
    ]
  }
  if (brief.eventType === "community") {
    return [
      { title: "Confirm the place and any permission you need", daysBefore: 21, priority: "high" },
      { title: "Plan food, water, and how it will be served", daysBefore: 14, priority: "high" },
      { title: "Tell people the time, place, and what to bring", daysBefore: 7, priority: "medium" },
      { title: "List equipment and who will carry it", daysBefore: 3, priority: "medium" },
      { title: "Write the event-day running order", daysBefore: 0, priority: "high" },
    ]
  }
  return [
    { title: "Shortlist the place and a rain or heat backup", daysBefore: 21, priority: "high" },
    { title: "Confirm cake, food, and serving plan", daysBefore: 14, priority: "high" },
    { title: "Invite guests with time and place", daysBefore: 7, priority: "medium" },
    { title: "Gather simple decorations and a photo plan", daysBefore: 3, priority: "medium" },
    { title: "Write the party-day running order", daysBefore: 0, priority: "high" },
  ]
}

function vendorTemplates(brief: Brief): Array<{ category: string; why: string }> {
  const place =
    brief.venueStyle === "outdoor"
      ? "Outdoor place"
      : "Indoor place"
  const rows = [
    {
      category: place,
      why: `Space for about ${brief.guestCount} people in ${brief.city}. You fill in the real contact.`,
    },
    {
      category: "Food",
      why: `${DIET_LABELS[brief.diet]} food. Ask for a written estimate before you treat a number as final.`,
    },
  ]
  if (brief.eventType !== "community" || /decor/i.test(brief.wish)) {
    rows.push({
      category: "Decor",
      why: "Only the pieces you actually want. Skip a package that spends the spare budget.",
    })
  }
  if (/photo/i.test(brief.wish) || brief.eventType === "wedding") {
    rows.push({
      category: "Photographer",
      why: "A person you choose. Mehfil does not list studios or phone numbers.",
    })
  }
  if (brief.eventType === "birthday") {
    rows.push({
      category: "Cake",
      why: "Match the diet and the guest count. Confirm the pickup time yourself.",
    })
  }
  if (brief.eventType === "community") {
    rows.push({
      category: "Sound or chairs",
      why: "Borrow first if the budget is tight. Record who is bringing each item.",
    })
  }
  return rows
}

function ideaTemplates(brief: Brief, idFor: (kind: string) => string): Idea[] {
  const ideas: Array<Omit<Idea, "id">> = []
  if (brief.venueStyle === "outdoor") {
    ideas.push({
      title: "Shade before sparkle",
      detail: `For an outdoor gathering in ${brief.city}, sort shade, seating for ${brief.guestCount}, and a wet-weather backup before you buy decor.`,
    })
  } else {
    ideas.push({
      title: "One room, one path",
      detail: `Keep the indoor path clear: entry, food, and a place to sit for ${brief.guestCount} guests.`,
    })
  }
  if (brief.diet === "vegetarian" || brief.diet === "vegan" || brief.diet === "eggetarian") {
    ideas.push({
      title: "Say the menu out loud",
      detail: `Put “${DIET_LABELS[brief.diet].toLowerCase()}” on the invite so guests are not guessing at the table.`,
    })
  } else {
    ideas.push({
      title: "Label the trays",
      detail: "Mark vegetarian and other trays so people can serve themselves without asking twice.",
    })
  }
  if (/photo/i.test(brief.wish)) {
    ideas.push({
      title: "A short photo list",
      detail: "Ask for arrivals, the main moment, and one group picture. A long shot list spends time you may not have.",
    })
  }
  if (/simple/i.test(brief.wish)) {
    ideas.push({
      title: "Repeat one material",
      detail: "Use one color of cloth or paper in two places. It reads as a theme without a decorator package.",
    })
  }
  ideas.push({
    title: "A last-hour card",
    detail: `Write who handles food, who watches the door, and who starts the ${brief.eventType === "birthday" ? "cake" : "welcome"} on time.`,
  })
  return ideas.slice(0, 4).map((idea) => ({ ...idea, id: idFor(idea.title) }))
}

export function buildSamplePlan(
  brief: Brief,
  options?: {
    today?: Date
    nowIso?: string
    idFor?: (kind: string) => string
  },
): Plan {
  const today = options?.today ?? new Date()
  const idFor = options?.idFor ?? makeId
  const nowIso = options?.nowIso ?? new Date().toISOString()
  const tasks = sortTasks(
    taskTemplates(brief).map((task) => ({
      id: idFor(task.title),
      title: task.title,
      dueDate: dueDateFor(brief.eventDate, task.daysBefore, today),
      priority: task.priority,
      done: false,
      doneLocked: false,
    })),
  )
  return {
    id: idFor("plan"),
    brief,
    summary: `A sample ${EVENT_LABELS[brief.eventType].toLowerCase()} plan for ${brief.guestCount} guests in ${brief.city}, built from your budget of ${formatInr(brief.budgetInr)}. These figures are local estimates, not a live Gemini response and not confirmed prices.`,
    budgetLines: allocateBudget(brief.budgetInr, sharesFor(brief), idFor),
    tasks,
    vendors: vendorTemplates(brief).map((vendor) => ({
      id: idFor(vendor.category),
      category: vendor.category,
      why: vendor.why,
      status: "pending" as const,
      contactName: "",
      contactPhone: "",
      quoteInr: null,
      detailsLocked: false,
      userAdded: false,
    })),
    ideas: ideaTemplates(brief, idFor),
    source: "sample",
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

function cleanMoney(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(amount) || amount < 0) return 0
  return Math.round(Math.min(amount, LIMITS.budgetMax))
}

function cleanDate(value: unknown, fallback: string): string {
  const text = cleanText(value, 10)
  return parseIsoDate(text) ? text : fallback
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

  return {
    id: nextId("plan", record.id),
    brief,
    summary,
    budgetLines,
    tasks,
    vendors,
    ideas,
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
    source: incoming.source === "gemini" ? "gemini" : previous.source,
    updatedAt: nowIso,
  }
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
      (item) =>
        item.id === task.id || sameKey(item.title, task.title),
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
    return {
      ...normalized,
      id: cleanText(record.id, 80) || normalized.id,
      budgetLines,
      tasks: sortTasks(tasks),
      vendors,
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
  }
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
