import { planForPrompt, type Brief, type Plan } from "@/lib/plan"

const DEFAULT_MODEL = "gemini-3.6-flash"
const FALLBACK_MODELS = ["gemini-3.5-flash"] as const

export function geminiModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim()
  return configured || DEFAULT_MODEL
}

export function buildPrompt(
  brief: Brief,
  followUp: string,
  currentPlan: Plan | null,
): string {
  const lines = [
    "You are Mehfil, a celebration planner for events in India.",
    "Return a practical plan for this brief. Currency is INR.",
    "Budget figures are estimates, never confirmed vendor prices or bookings.",
    "Vendors are categories the host should contact. Do not invent business names, phone numbers, websites, or addresses.",
    "Cover a budget, a dated task timeline, a vendor checklist, personalized ideas, and a 5 to 7 row day-of schedule (24-hour HH:MM times).",
    "Use the city, guest count, diet, indoor or outdoor setting, and the host's own words.",
    "Keep every list under 8 items. Write short sentences.",
    "",
    "Event brief:",
    JSON.stringify(brief),
  ]
  if (currentPlan) {
    lines.push(
      "",
      "Revise this existing plan. Preserve every id.",
      "Do not change estimateInr when amountLocked is true.",
      "Do not change done when doneLocked is true.",
      "Do not remove items with amountLocked, doneLocked, or detailsLocked set to true.",
      "Do not invent contacts. Contact fields are stored only in the app.",
      "Existing plan:",
      JSON.stringify(planForPrompt(currentPlan)),
    )
  }
  if (followUp) {
    lines.push("", "Host's follow-up note:", followUp)
  }
  return lines.join("\n")
}

const responseSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    budgetLines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          category: { type: "string" },
          estimateInr: { type: "number" },
          note: { type: "string" },
        },
        required: ["category", "estimateInr", "note"],
      },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          dueDate: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["title", "dueDate", "priority"],
      },
    },
    vendors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          category: { type: "string" },
          why: { type: "string" },
        },
        required: ["category", "why"],
      },
    },
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          detail: { type: "string" },
        },
        required: ["title", "detail"],
      },
    },
    daySchedule: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          time: { type: "string" },
          moment: { type: "string" },
          note: { type: "string" },
        },
        required: ["time", "moment", "note"],
      },
    },
  },
  required: ["summary", "budgetLines", "tasks", "vendors", "ideas", "daySchedule"],
}

const RETRYABLE_STATUS = new Set([429, 503])

function abortError(): DOMException {
  return new DOMException("The operation was aborted", "AbortError")
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(abortError())
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

export async function generateWithGemini(args: {
  apiKey: string
  brief: Brief
  followUp: string
  currentPlan: Plan | null
  signal: AbortSignal
}): Promise<unknown> {
  const primary = geminiModel()
  const models = [
    primary,
    ...FALLBACK_MODELS.filter((candidate) => candidate !== primary),
  ]
  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(args.brief, args.followUp, args.currentPlan) }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema,
      // Leave this at 0. Hidden reasoning makes Flash miss the request deadline.
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  let response: Response | null = null
  for (let index = 0; index < models.length; index += 1) {
    const model = models[index]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    for (let attempt = 0; attempt < 2; attempt += 1) {
      response = await fetch(url, {
        method: "POST",
        signal: args.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": args.apiKey,
        },
        body,
      })
      if (response.ok || !RETRYABLE_STATUS.has(response.status) || attempt === 1) break
      await pause(600, args.signal)
    }
    if (response?.ok || !response || !RETRYABLE_STATUS.has(response.status)) break
  }

  if (!response?.ok) {
    throw new Error(`GEMINI_${response?.status ?? 0}`)
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("")
  if (!text) throw new Error("GEMINI_EMPTY")
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "")
  return JSON.parse(trimmed) as unknown
}
