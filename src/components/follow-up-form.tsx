"use client";

// Couche présentation : planifier / supprimer la prochaine relance depuis la fiche (lot 4).
// Les actions serveur sont reçues en props ; la validation (date, contact clôturé) est faite par le service.
import { useActionState } from "react";
import { formatDayMonth } from "@/components/format-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type FollowUpState = { value: string; error?: string };

export function FollowUpForm({
  nextFollowUp,
  closed,
  scheduleAction,
  clearAction,
  initialState,
}: {
  nextFollowUp: string | null;
  closed: boolean;
  scheduleAction: (state: FollowUpState, formData: FormData) => Promise<FollowUpState>;
  clearAction: () => Promise<void>;
  initialState?: FollowUpState;
}) {
  const [state, formAction, pending] = useActionState(scheduleAction, initialState ?? { value: nextFollowUp ?? "" });

  if (closed) {
    return <p className="text-sm text-muted-foreground">Contact clôturé : pas de relance à planifier.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {nextFollowUp ? (
          <span className="font-medium">Relance : {formatDayMonth(nextFollowUp)}</span>
        ) : (
          <span className="text-muted-foreground">Aucune relance planifiée.</span>
        )}
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="follow-up-date">Date de relance</Label>
            <Input
              id="follow-up-date"
              name="date"
              type="date"
              defaultValue={state.value}
              required
              className="w-auto"
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? "follow-up-error" : undefined}
            />
          </div>
          <Button type="submit" disabled={pending}>
            Planifier
          </Button>
        </form>

        {nextFollowUp && (
          <form action={clearAction}>
            <Button type="submit" variant="outline">
              Supprimer la relance
            </Button>
          </form>
        )}
      </div>

      {state.error && (
        <p id="follow-up-error" aria-live="polite" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}
