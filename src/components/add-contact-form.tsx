"use client";

// Couche présentation : formulaire d'ajout. L'action serveur est reçue en props.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_LIMITS } from "@/services/contact.schema";

export type AddContactState = { error?: string };

export function AddContactForm({
  action,
  initialState = {},
}: {
  action: (state: AddContactState, formData: FormData) => Promise<AddContactState>;
  initialState?: AddContactState;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const hasError = Boolean(state.error);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="contact-name">Nom</Label>
      <div className="flex gap-2">
        <Input
          id="contact-name"
          name="name"
          placeholder="Camille Martin"
          autoComplete="off"
          required
          maxLength={CONTACT_LIMITS.name}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? "contact-name-error" : undefined}
        />
        <Button type="submit" disabled={pending}>
          Ajouter
        </Button>
      </div>
      <p id="contact-name-error" aria-live="polite" className="min-h-5 text-sm text-destructive">
        {state.error}
      </p>
    </form>
  );
}
