import { describe, expect, it } from "vitest"
import { buildPrompt } from "@/lib/gemini"
import {
  budgetSnapshot,
  budgetTotal,
  buildSamplePlan,
  mergeRefinement,
  normalizeGeneratedPlan,
  parsePlanRequest,
  sortTasks,
  validateBrief,
  type Brief,
  type PlanTask,
} from "@/lib/plan"

const today = new Date(2026, 9, 25)

const brief: Brief = {
  eventType: "birthday",
  eventDate: "2026-11-24",
  city: "Pune",
  guestCount: 30,
  budgetInr: 20000,
  diet: "vegetarian",
  venueStyle: "outdoor",
  wish: "I prefer simple decorations, vegetarian food, and a photography service.",
}

function ids() {
  let n = 0
  return (kind: string) => `${kind}-${++n}`
}

function sample(overrides?: Partial<Brief>, budget = brief.budgetInr) {
  return buildSamplePlan(
    { ...brief, ...overrides, budgetInr: budget },
    { today, nowIso: "2026-10-25T12:00:00.000Z", idFor: ids() },
  )
}

describe("budget", () => {
  it("sums line estimates", () => {
    expect(budgetTotal([{ estimateInr: 1200 }, { estimateInr: 800 }])).toBe(2000)
  })

  it("flags an over-budget plan and reports the gap", () => {
    const snapshot = budgetSnapshot(
      [{ estimateInr: 15000 }, { estimateInr: 8000 }],
      20000,
    )
    expect(snapshot.overBudget).toBe(true)
    expect(snapshot.overByInr).toBe(3000)
    expect(snapshot.remainingInr).toBe(-3000)
    expect(snapshot.plannedInr).toBe(23000)
  })

  it("keeps a remaining balance when the plan is under the cap", () => {
    const snapshot = budgetSnapshot([{ estimateInr: 12000 }], 20000)
    expect(snapshot.overBudget).toBe(false)
    expect(snapshot.remainingInr).toBe(8000)
    expect(snapshot.percent).toBe(60)
  })

  it("makes the sample budget add up to the cap", () => {
    for (const budget of [20000, 12345, 500, 99999]) {
      const plan = sample(undefined, budget)
      expect(budgetTotal(plan.budgetLines)).toBe(budget)
      expect(budgetSnapshot(plan.budgetLines, budget).overBudget).toBe(false)
    }
  })
})

describe("timeline", () => {
  it("orders tasks by date, then by priority", () => {
    const tasks = [
      task("low", "2026-11-02"),
      task("low", "2026-11-01"),
      task("high", "2026-11-01"),
    ]
    expect(sortTasks(tasks).map((item) => `${item.dueDate}:${item.priority}`)).toEqual([
      "2026-11-01:high",
      "2026-11-01:low",
      "2026-11-02:low",
    ])
  })

  it("pulls early tasks forward when the event is soon", () => {
    const plan = buildSamplePlan(
      { ...brief, eventDate: "2026-10-28" },
      { today, nowIso: "2026-10-25T12:00:00.000Z", idFor: ids() },
    )
    expect(plan.tasks.some((item) => item.dueDate < "2026-10-25")).toBe(false)
    expect(plan.tasks[plan.tasks.length - 1]?.dueDate).toBe("2026-10-28")
    expect(plan.tasks.map((item) => item.dueDate)).toEqual(
      [...plan.tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((item) => item.dueDate),
    )
  })
})

describe("sample plan", () => {
  it("does not invent vendor contacts", () => {
    const plan = sample()
    expect(plan.source).toBe("sample")
    expect(plan.vendors.length).toBeGreaterThan(0)
    for (const vendor of plan.vendors) {
      expect(vendor.contactName).toBe("")
      expect(vendor.contactPhone).toBe("")
      expect(vendor.quoteInr).toBeNull()
    }
    expect(plan.summary.toLowerCase()).toContain("not a live gemini")
  })
})

describe("gemini output", () => {
  it("strips invented vendor names and phone numbers", () => {
    const plan = normalizeGeneratedPlan(
      {
        summary: "A small outdoor birthday in Pune.",
        budgetLines: [
          { category: "Food", estimateInr: 8000, note: "Estimate" },
        ],
        tasks: [
          { title: "Order the cake", dueDate: "2026-11-20", priority: "high" },
        ],
        vendors: [
          {
            category: "Photographer",
            why: "For a short portrait session.",
            contactName: "Fake Studio",
            contactPhone: "9999999999",
          },
        ],
        ideas: [
          {
            title: "String lights",
            detail: "Keep them low so they do not fight the daylight.",
          },
        ],
      },
      brief,
      "gemini",
      "2026-10-25T12:00:00.000Z",
      ids(),
    )
    expect(plan.vendors[0]?.contactName).toBe("")
    expect(plan.vendors[0]?.contactPhone).toBe("")
    expect(plan.source).toBe("gemini")
  })

  it("tells the model not to invent businesses", () => {
    const prompt = buildPrompt(brief, "Add a quieter welcome.", null)
    expect(prompt).toContain("Do not invent business names")
    expect(prompt).toContain("Pune")
  })
})

describe("merge", () => {
  it("keeps locked amounts, checked tasks, and typed vendor details", () => {
    const previous = sample()
    previous.budgetLines[0] = {
      ...previous.budgetLines[0],
      estimateInr: 111,
      amountLocked: true,
    }
    previous.tasks[0] = { ...previous.tasks[0], done: true, doneLocked: true }
    previous.vendors[0] = {
      ...previous.vendors[0],
      status: "confirmed",
      contactName: "Asha",
      contactPhone: "9876543210",
      quoteInr: 2500,
      detailsLocked: true,
    }
    const incoming = normalizeGeneratedPlan(
      {
        summary: "Revised around a quieter welcome.",
        budgetLines: previous.budgetLines.map((line) => ({
          ...line,
          estimateInr: 9999,
        })),
        tasks: previous.tasks.map((task) => ({ ...task, done: false })),
        vendors: [
          ...previous.vendors.map((vendor) => ({
            ...vendor,
            contactName: "Invented Shop",
            contactPhone: "9000000000",
            status: "pending",
          })),
          {
            category: "Playlist",
            why: "Someone's phone is enough.",
          },
        ],
        ideas: [{ title: "Soft welcome", detail: "Skip a loud entrance." }],
      },
      brief,
      "gemini",
      "2026-10-26T12:00:00.000Z",
      ids(),
    )
    const merged = mergeRefinement(previous, incoming, "2026-10-26T12:00:00.000Z", brief)
    expect(merged.budgetLines[0]?.estimateInr).toBe(111)
    expect(merged.tasks.find((task) => task.id === previous.tasks[0]?.id)?.done).toBe(true)
    const vendor = merged.vendors.find((item) => item.id === previous.vendors[0]?.id)
    expect(vendor?.contactName).toBe("Asha")
    expect(vendor?.contactPhone).toBe("9876543210")
    expect(vendor?.status).toBe("confirmed")
    expect(merged.vendors.some((item) => item.contactName === "Invented Shop")).toBe(false)
    expect(merged.ideas[0]?.title).toBe("Soft welcome")
    expect(merged.source).toBe("gemini")
  })
})

describe("validation", () => {
  it("accepts the birthday example", () => {
    const result = validateBrief(brief, today)
    expect(result.ok).toBe(true)
  })

  it("rejects an empty city, a bad date, and an impossible guest count", () => {
    const result = validateBrief(
      { ...brief, city: " ", eventDate: "2026-02-31", guestCount: 9000 },
      today,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.city).toBeTruthy()
      expect(result.errors.eventDate).toBeTruthy()
      expect(result.errors.guestCount).toBeTruthy()
    }
  })

  it("rejects a refine note when there is no plan yet", () => {
    const result = parsePlanRequest(
      { brief, followUp: "Make the decor cheaper." },
      today,
    )
    expect(result.ok).toBe(false)
  })
})

function task(priority: PlanTask["priority"], dueDate: string): PlanTask {
  return {
    id: `${dueDate}-${priority}`,
    title: dueDate,
    dueDate,
    priority,
    done: false,
    doneLocked: false,
  }
}
