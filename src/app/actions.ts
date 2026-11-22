"use server";

// Couche présentation : Server Actions. Elles délèguent au service et traduisent ses erreurs en messages.
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import type { AddContactState } from "@/components/add-contact-form";
import type { ContactFormState, ContactFormValues } from "@/components/contact-form";
import type { FollowUpState } from "@/components/follow-up-form";
import { CONTACT_LIMITS } from "@/services/contact.schema";
import {
  contactService,
  type AddContactError,
  type ContactFieldErrors,
  type FollowUpError,
} from "@/services/contact.service";

const MESSAGES: Record<AddContactError | NonNullable<ContactFieldErrors[keyof ContactFieldErrors]>, string> = {
  NAME_REQUIRED: "Le nom est requis.",
  NAME_TOO_LONG: `Le nom ne doit pas dépasser ${CONTACT_LIMITS.name} caractères.`,
  EMAIL_INVALID: "Adresse e-mail invalide.",
  COMPANY_TOO_LONG: `L’entreprise ne doit pas dépasser ${CONTACT_LIMITS.company} caractères.`,
  PHONE_TOO_LONG: `Le téléphone ne doit pas dépasser ${CONTACT_LIMITS.phone} caractères.`,
  NOTES_TOO_LONG: `Les notes ne doivent pas dépasser ${CONTACT_LIMITS.notes} caractères.`,
};

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function addContactAction(
  _state: AddContactState,
  formData: FormData,
): Promise<AddContactState> {
  // Validation côté serveur par le service (zod) : on lui passe la donnée brute.
  const result = await contactService.addContact(formData.get("name"));

  if (!result.ok) return { error: MESSAGES[result.error] };

  revalidatePath("/");
  return {};
}

// L'identifiant est un argument lié (.bind) : il vient du client comme le reste, donc `unknown`.
// prevState n'est pas utilisé : il n'a pas à être validé.
export async function updateContactAction(
  id: unknown,
  _state: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Validation côté serveur par le service (zod) : on lui passe l'id et les champs bruts du formulaire.
  const result = await contactService.updateContact(id, Object.fromEntries(formData));

  // Saisie renvoyée au formulaire, pour ne pas la perdre en cas d'erreur.
  const values: ContactFormValues = {
    name: text(formData, "name"),
    company: text(formData, "company"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    notes: text(formData, "notes"),
  };

  if (!result.ok) {
    if ("error" in result) notFound();
    return {
      values,
      errors: {
        name: result.errors.name && MESSAGES[result.errors.name],
        email: result.errors.email && MESSAGES[result.errors.email],
        company: result.errors.company && MESSAGES[result.errors.company],
        phone: result.errors.phone && MESSAGES[result.errors.phone],
        notes: result.errors.notes && MESSAGES[result.errors.notes],
      },
    };
  }

  revalidatePath("/");
  const { contact } = result;
  revalidatePath(`/contacts/${contact.id}`);
  return {
    values: {
      name: contact.name,
      company: contact.company ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      notes: contact.notes ?? "",
    },
    saved: true,
  };
}

export async function deleteContactAction(id: unknown): Promise<void> {
  // Validation côté serveur par le service (zod) ; un id invalide ne supprime rien.
  await contactService.deleteContact(id);
  revalidatePath("/");
  redirect("/");
}

export async function changeStageAction(id: unknown, formData: FormData): Promise<void> {
  // Validation côté serveur par le service (zod) : id lié et étape transmis bruts.
  const result = await contactService.changeStage(id, formData.get("stage"));
  if (!result.ok) return; // étape forgée ou contact disparu : rien ne change

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath(`/contacts/${result.contact.id}`);
}

const FOLLOW_UP_MESSAGES: Record<Exclude<FollowUpError, "NOT_FOUND">, string> = {
  DATE_INVALID: "Date invalide.",
  DATE_PAST: "La date de relance ne peut pas être passée.",
  CONTACT_CLOSED: "Un contact clôturé ne peut pas avoir de relance.",
};

export async function scheduleFollowUpAction(
  id: unknown,
  _state: FollowUpState,
  formData: FormData,
): Promise<FollowUpState> {
  // Validation côté serveur par le service (zod) : id lié et date transmis bruts.
  const result = await contactService.scheduleFollowUp(id, formData.get("date"));
  const value = text(formData, "date");

  if (!result.ok) {
    if (result.error === "NOT_FOUND") notFound();
    return { value, error: FOLLOW_UP_MESSAGES[result.error] };
  }

  revalidatePath("/");
  revalidatePath(`/contacts/${result.contact.id}`);
  return { value };
}

export async function clearFollowUpAction(id: unknown): Promise<void> {
  const result = await contactService.clearFollowUp(id);
  if (!result.ok) return;

  revalidatePath("/");
  revalidatePath(`/contacts/${result.contact.id}`);
}

/** Relance faite (vue « Aujourd'hui ») : le contact n'a plus de relance planifiée. */
export async function markFollowUpDoneAction(id: unknown): Promise<void> {
  const result = await contactService.clearFollowUp(id);
  if (!result.ok) return;

  revalidatePath("/aujourdhui");
  revalidatePath("/");
  revalidatePath(`/contacts/${result.contact.id}`);
}

/** Relance reportée au lendemain (vue « Aujourd'hui »). */
export async function postponeFollowUpAction(id: unknown): Promise<void> {
  const result = await contactService.postponeFollowUp(id);
  if (!result.ok) return;

  revalidatePath("/aujourdhui");
  revalidatePath("/");
  revalidatePath(`/contacts/${result.contact.id}`);
}
