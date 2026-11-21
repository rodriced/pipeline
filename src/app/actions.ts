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
  const result = await contactService.addContact(text(formData, "name"));

  if (!result.ok) return { error: MESSAGES[result.error] };

  revalidatePath("/");
  return {};
}

export async function updateContactAction(
  id: number,
  _state: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values: ContactFormValues = {
    name: text(formData, "name"),
    company: text(formData, "company"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    notes: text(formData, "notes"),
  };

  const result = await contactService.updateContact(id, values);

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
  revalidatePath(`/contacts/${id}`);
  const { contact } = result;
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

export async function deleteContactAction(id: number): Promise<void> {
  await contactService.deleteContact(id);
  revalidatePath("/");
  redirect("/");
}
