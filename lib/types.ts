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

export interface DayScheduleRow {
  id: string
  time: string
  moment: string
  note: string
  locked: boolean
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
  daySchedule: DayScheduleRow[]
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

export const LIMITS = {
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
} as const
