"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ChoiceField<T extends string>({
  id,
  label,
  value,
  items,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: T
  items: Record<T, string>
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        items={items}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (typeof next === "string" && next in items) onChange(next as T)
        }}
      >
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(items) as Array<[T, string]>).map(([itemValue, itemLabel]) => (
            <SelectItem key={itemValue} value={itemValue}>
              {itemLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
