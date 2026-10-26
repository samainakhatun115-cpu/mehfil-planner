import {
  addDays,
  formatInr,
  formatIsoDate,
  makeId,
  parseIsoDate,
  sortTasks,
  startOfDay,
} from "@/lib/format"
import {
  DIET_LABELS,
  EVENT_LABELS,
  VENUE_LABELS,
  type Brief,
  type BudgetLine,
  type DayScheduleRow,
  type Idea,
  type Plan,
  type Priority,
} from "@/lib/types"

export interface Share {
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
  const place = brief.venueStyle === "outdoor" ? "Outdoor place" : "Indoor place"
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

export function buildDaySchedule(
  brief: Brief,
  idFor: (kind: string) => string = makeId,
): DayScheduleRow[] {
  const venue = brief.venueStyle === "outdoor" ? "outdoor" : "indoor"
  const guestWord = brief.guestCount === 1 ? "guest" : "guests"
  const startHour = brief.eventType === "wedding" ? 10 : brief.eventType === "community" ? 9 : 11

  const rows: Array<Omit<DayScheduleRow, "id" | "locked">> = [
    {
      time: `${String(startHour - 1).padStart(2, "0")}:00`,
      moment: "Setup and final check",
      note: `Arrive at the ${venue} venue, confirm food station and seating for ${brief.guestCount} ${guestWord}.`,
    },
    {
      time: `${String(startHour).padStart(2, "0")}:00`,
      moment: "Guests arrive",
      note: `Welcome ${brief.guestCount} ${guestWord} at the entrance. Have someone at the door.`,
    },
    {
      time: `${String(startHour).padStart(2, "0")}:30`,
      moment:
        brief.eventType === "wedding"
          ? "Ceremony begins"
          : brief.eventType === "community"
            ? "Opening words"
            : "Welcome and gather",
      note:
        brief.venueStyle === "outdoor"
          ? `Keep the welcome short if the gathering is outdoors in ${brief.city} in the evening.`
          : "Bring everyone together. Keep it short — guests are still settling in.",
    },
    {
      time: `${String(startHour + 1).padStart(2, "0")}:00`,
      moment: "Food is served",
      note: `${brief.diet.charAt(0).toUpperCase() + brief.diet.slice(1)} menu. Ensure all trays are labelled before guests line up.`,
    },
    {
      time: `${String(startHour + 2).padStart(2, "0")}:00`,
      moment:
        brief.eventType === "birthday"
          ? "Cake and celebration"
          : brief.eventType === "wedding"
            ? "Main ceremony moment"
            : "Main programme",
      note:
        brief.eventType === "birthday"
          ? "Cake cutting, photos, and a round of wishes."
          : brief.eventType === "wedding"
            ? "The key ritual or exchange of vows. Photographer should be in position."
            : "Central talk, activity, or performance.",
    },
    {
      time: `${String(startHour + 3).padStart(2, "0")}:00`,
      moment: "Mingle and wrap up",
      note: `Free time. Collect any RSVPs or feedback. Begin clearing up the ${venue} space.`,
    },
    {
      time: `${String(startHour + 4).padStart(2, "0")}:00`,
      moment: "Guests depart",
      note: `Say goodbye and ensure everyone has a safe way home from ${brief.city}.`,
    },
  ]

  return rows.map((row) => ({
    ...row,
    id: idFor(`day-${row.moment}`),
    locked: false,
  }))
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
    daySchedule: buildDaySchedule(brief, idFor),
    source: "sample",
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}
