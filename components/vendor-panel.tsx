"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  VENDOR_STATUS_LABELS,
  type VendorItem,
  type VendorStatus,
} from "@/lib/plan"
import { ChoiceField } from "@/components/choice-field"

export function VendorPanel({
  vendors,
  disabled,
  onChange,
  onAdd,
  onRemove,
}: {
  vendors: VendorItem[]
  disabled: boolean
  onChange: (id: string, patch: Partial<VendorItem>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        These are categories, not shop listings. Type a real contact only if you already have one. Mehfil will not invent a phone number.
      </p>
      <ul className="grid gap-3">
        {vendors.map((vendor) => (
          <li key={vendor.id} className="grid gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{vendor.category}</p>
                <p className="text-sm text-muted-foreground">{vendor.why}</p>
              </div>
              {vendor.userAdded ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onRemove(vendor.id)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceField
                id={`status-${vendor.id}`}
                label="Booking status"
                value={vendor.status}
                items={VENDOR_STATUS_LABELS}
                disabled={disabled}
                onChange={(status: VendorStatus) => onChange(vendor.id, { status, detailsLocked: true })}
              />
              <div className="grid gap-1.5">
                <Label htmlFor={`quote-${vendor.id}`}>Their quote (₹)</Label>
                <Input
                  id={`quote-${vendor.id}`}
                  className="h-10"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  disabled={disabled}
                  value={vendor.quoteInr ?? ""}
                  placeholder="Optional"
                  onChange={(event) =>
                    onChange(vendor.id, {
                      quoteInr: event.target.value === "" ? null : Number(event.target.value),
                      detailsLocked: true,
                    })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`contact-${vendor.id}`}>Contact name</Label>
                <Input
                  id={`contact-${vendor.id}`}
                  className="h-10"
                  disabled={disabled}
                  autoComplete="name"
                  value={vendor.contactName}
                  onChange={(event) =>
                    onChange(vendor.id, {
                      contactName: event.target.value.slice(0, 80),
                      detailsLocked: true,
                    })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`phone-${vendor.id}`}>Phone</Label>
                <Input
                  id={`phone-${vendor.id}`}
                  className="h-10"
                  type="tel"
                  autoComplete="tel"
                  disabled={disabled}
                  value={vendor.contactPhone}
                  onChange={(event) =>
                    onChange(vendor.id, {
                      contactPhone: event.target.value.replace(/[^\d+\-() ]/g, "").slice(0, 20),
                      detailsLocked: true,
                    })
                  }
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" disabled={disabled} onClick={onAdd}>
        Add a vendor you already know
      </Button>
    </div>
  )
}
