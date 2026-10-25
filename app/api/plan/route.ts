import { generateWithGemini } from "@/lib/gemini"
import {
  mergeRefinement,
  normalizeGeneratedPlan,
  parsePlanRequest,
} from "@/lib/plan"

export const maxDuration = 30

const BODY_LIMIT = 100_000
const TIMEOUT_MS = 20_000

function jsonError(status: number, error: string, message: string, errors?: object) {
  return Response.json(
    { error, message, ...(errors ? { errors } : {}) },
    { status },
  )
}

export async function POST(request: Request) {
  let text: string
  try {
    text = await request.text()
  } catch {
    return jsonError(400, "BAD_JSON", "The request body could not be read.")
  }
  if (text.length > BODY_LIMIT) {
    return jsonError(413, "TOO_LARGE", "That request is too large.")
  }

  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    return jsonError(400, "BAD_JSON", "Send valid JSON.")
  }

  const parsed = parsePlanRequest(body)
  if (!parsed.ok) {
    return jsonError(400, "INVALID", parsed.message, parsed.errors)
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    return jsonError(
      503,
      "NO_KEY",
      "Add GEMINI_API_KEY on the server to generate a live plan. A sample plan is only a local preview and does not call Gemini.",
    )
  }

  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  try {
    const raw = await generateWithGemini({
      apiKey,
      brief: parsed.brief,
      followUp: parsed.followUp,
      currentPlan: parsed.currentPlan,
      signal: timeout,
    })
    const nowIso = new Date().toISOString()
    const generated = normalizeGeneratedPlan(raw, parsed.brief, "gemini", nowIso)
    const plan = parsed.currentPlan
      ? mergeRefinement(parsed.currentPlan, generated, nowIso, parsed.brief)
      : generated
    return Response.json({ plan })
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown"
    console.error("plan generation failed:", reason)
    if (timeout.aborted || (error instanceof Error && error.name === "AbortError")) {
      return jsonError(
        504,
        "TIMEOUT",
        "Gemini took too long. Try again with a shorter note.",
      )
    }
    if (error instanceof Error && error.message === "EMPTY_PLAN") {
      return jsonError(
        502,
        "UPSTREAM",
        "Gemini returned a plan that was missing a budget, timeline, vendor list, or ideas. Try again.",
      )
    }
    return jsonError(
      502,
      "UPSTREAM",
      "Gemini could not write a plan just now. Check the API key and try again.",
    )
  }
}
