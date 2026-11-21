"use server";

// Couche présentation : Server Actions. Elles délèguent au service et traduisent ses erreurs en messages.
import { revalidatePath } from "next/cache";
import type { AddContactState } from "@/components/add-contact-form";
import { contactService, type AddContactError } from "@/services/contact.service";

const MESSAGES: Record<AddContactError, string> = {
  NAME_REQUIRED: "Le nom est requis.",
};

export async function addContactAction(
  _state: AddContactState,
  formData: FormData,
): Promise<AddContactState> {
  const name = formData.get("name");
  const result = await contactService.addContact(typeof name === "string" ? name : "");

  if (!result.ok) return { error: MESSAGES[result.error] };

  revalidatePath("/");
  return {};
}
