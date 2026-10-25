"use client"

import { BudgetPanel } from "@/components/budget-panel"
import { IdeasPanel } from "@/components/ideas-panel"
import { TimelinePanel } from "@/components/timeline-panel"
import { VendorPanel } from "@/components/vendor-panel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  EVENT_LABELS,
  countdownLabel,
  type Plan,
  type VendorItem,
} from "@/lib/plan"

export function PlanWorkspace({
  plan,
  followUp,
  followUpError,
  disabled,
  onBudget,
  onToggleTask,
  onVendor,
  onAddVendor,
  onRemoveVendor,
  onFollowUp,
  onRefine,
  onClear,
}: {
  plan: Plan | null
  followUp: string
  followUpError?: string
  disabled: boolean
  onBudget: (id: string, estimateInr: number) => void
  onToggleTask: (id: string, done: boolean) => void
  onVendor: (id: string, patch: Partial<VendorItem>) => void
  onAddVendor: () => void
  onRemoveVendor: (id: string) => void
  onFollowUp: (value: string) => void
  onRefine: () => void
  onClear: () => void
}) {
  if (!plan) {
    return (
      <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-card/70 p-6">
        <h2 className="font-heading text-xl font-medium">Your plan will land here</h2>
        <p className="max-w-prose text-sm leading-6 text-muted-foreground">
          Generate a plan to get a budget, a timeline, a vendor checklist, and ideas you can edit. The birthday example is a fast way to see a finished shape.
        </p>
      </div>
    )
  }

  return (
    <section className="grid gap-4" aria-labelledby="plan-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="plan-heading" className="font-heading text-xl font-medium">
              {EVENT_LABELS[plan.brief.eventType]} in {plan.brief.city}
            </h2>
            <Badge variant={plan.source === "sample" ? "outline" : "default"}>
              {plan.source === "sample" ? "Sample plan" : "Gemini plan"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <time dateTime={plan.brief.eventDate}>{countdownLabel(plan.brief.eventDate)}</time>
            {" · "}
            {plan.brief.guestCount} guests
          </p>
        </div>
        <Button type="button" variant="ghost" disabled={disabled} onClick={onClear}>
          Clear saved plan
        </Button>
      </div>
      {plan.source === "sample" ? (
        <Alert>
          <AlertTitle>This preview did not call Gemini</AlertTitle>
          <AlertDescription>
            Numbers below are local estimates so you can review the layout. A submitted app needs a live Gemini key on the server.
          </AlertDescription>
        </Alert>
      ) : null}
      <p className="max-w-prose text-sm leading-6">{plan.summary}</p>
      <Tabs defaultValue="budget">
        <TabsList className="h-auto! w-full flex-wrap justify-start">
          <TabsTrigger value="budget" className="h-8 px-3">
            Budget
          </TabsTrigger>
          <TabsTrigger value="timeline" className="h-8 px-3">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="vendors" className="h-8 px-3">
            Vendors
          </TabsTrigger>
          <TabsTrigger value="ideas" className="h-8 px-3">
            Ideas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="budget" className="pt-2">
          <BudgetPanel
            lines={plan.budgetLines}
            capInr={plan.brief.budgetInr}
            disabled={disabled}
            onChange={onBudget}
          />
        </TabsContent>
        <TabsContent value="timeline" className="pt-2">
          <TimelinePanel tasks={plan.tasks} disabled={disabled} onToggle={onToggleTask} />
        </TabsContent>
        <TabsContent value="vendors" className="pt-2">
          <VendorPanel
            vendors={plan.vendors}
            disabled={disabled}
            onChange={onVendor}
            onAdd={onAddVendor}
            onRemove={onRemoveVendor}
          />
        </TabsContent>
        <TabsContent value="ideas" className="pt-2">
          <IdeasPanel
            ideas={plan.ideas}
            followUp={followUp}
            error={followUpError}
            disabled={disabled}
            onFollowUp={onFollowUp}
            onRefine={onRefine}
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}
