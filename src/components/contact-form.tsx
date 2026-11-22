"use client";

// Couche présentation : formulaire de la fiche. L'action serveur est reçue en props.
// L'action renvoie les valeurs saisies : React réinitialise le formulaire après chaque envoi,
// et les defaultValue mis à jour évitent de perdre la saisie en cas d'erreur.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_LIMITS } from "@/services/contact.schema";

export type ContactFormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
};

export type ContactFormState = {
  values: ContactFormValues;
  errors?: { name?: string; email?: string; company?: string; phone?: string; notes?: string };
  saved?: boolean;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function ContactForm({
  action,
  initialState,
}: {
  action: (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;
  initialState: ContactFormState;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const { values, errors = {} } = state;

  const invalid = (field: keyof NonNullable<ContactFormState["errors"]>) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `contact-${field}-error` }
      : {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-name">Nom</Label>
        <Input
          id="contact-name"
          name="name"
          defaultValue={values.name}
          required
          maxLength={CONTACT_LIMITS.name}
          {...invalid("name")}
        />
        <FieldError id="contact-name-error" message={errors.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-company">Entreprise</Label>
        <Input
          id="contact-company"
          name="company"
          defaultValue={values.company}
          maxLength={CONTACT_LIMITS.company}
          {...invalid("company")}
        />
        <FieldError id="contact-company-error" message={errors.company} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">E-mail</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            defaultValue={values.email}
            autoComplete="off"
            maxLength={CONTACT_LIMITS.email}
            {...invalid("email")}
          />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-phone">Téléphone</Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            defaultValue={values.phone}
            autoComplete="off"
            maxLength={CONTACT_LIMITS.phone}
            {...invalid("phone")}
          />
          <FieldError id="contact-phone-error" message={errors.phone} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-notes">Notes</Label>
        <Textarea
          id="contact-notes"
          name="notes"
          defaultValue={values.notes}
          rows={4}
          maxLength={CONTACT_LIMITS.notes}
          {...invalid("notes")}
        />
        <FieldError id="contact-notes-error" message={errors.notes} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          Enregistrer
        </Button>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {state.saved && !pending ? "Modifications enregistrées." : null}
        </p>
      </div>
    </form>
  );
}
