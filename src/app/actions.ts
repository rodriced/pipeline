"use server";

// Couche présentation : Server Actions. Elles délèguent au service et traduisent ses erreurs en messages.
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import type { AddContactState } from "@/components/add-contact-form";
import type { ContactFormState, ContactFormValues } from "@/components/contact-form";
import { contactService, type AddContactError, type ContactFieldErrors } from "@/services/contact.service";

const MESSAGES: Record<AddContactError | NonNullable<ContactFieldErrors[keyof ContactFieldErrors]>, string> = {
  NAME_REQUIRED: "Le nom est requis.",
  EMAIL_INVALID: "Adresse e-mail invalide.",
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
