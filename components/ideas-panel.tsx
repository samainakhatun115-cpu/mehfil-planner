"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Idea } from "@/lib/plan"

export function IdeasPanel({
  ideas,
  followUp,
  error,
  disabled,
  onFollowUp,
  onRefine,
}: {
  ideas: Idea[]
  followUp: string
  error?: string
  disabled: boolean
  onFollowUp: (value: string) => void
  onRefine: () => void
}) {
  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {ideas.map((idea) => (
          <li key={idea.id}>
            <Card>
              <CardHeader>
                <CardTitle>{idea.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{idea.detail}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          onRefine()
        }}
      >
        <Label htmlFor="follow-up">Change the plan</Label>
        <Textarea
          id="follow-up"
          className="min-h-20"
          maxLength={500}
          value={followUp}
          disabled={disabled}
          placeholder="Ask for a cheaper decor plan, or a quieter welcome."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "follow-up-error" : "follow-up-hint"}
          onChange={(event) => onFollowUp(event.target.value)}
        />
        <p id="follow-up-hint" className="text-xs text-muted-foreground">
          Edited amounts, checked tasks, and vendor contacts stay in place.
        </p>
        {error ? (
          <p id="follow-up-error" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-10 w-fit px-4" disabled={disabled}>
          Refine plan
        </Button>
      </form>
    </div>
  )
}
