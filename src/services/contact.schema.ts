// Couche service : schémas zod des données d'un contact. C'est la validation côté serveur
// de tout ce qui arrive de l'extérieur (Server Actions, FormData) : forme et règles métier.
// Les messages des erreurs sont des codes métier ; la présentation les traduit.
import { z } from "zod";

const NAME_REQUIRED = "NAME_REQUIRED";
const EMAIL_INVALID = "EMAIL_INVALID";

const positiveId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

/**
 * Identifiant de contact : entier strictement positif, reçu en nombre (argument lié d'une action)
 * ou en chaîne de chiffres (segment d'URL). Rien d'autre : pas d'espaces, d'exposant ni d'hexadécimal.
 */
export const contactIdSchema = z.union([
  positiveId,
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(positiveId),
]);

/** Étapes du pipeline, dans l'ordre. Toute étape valide peut succéder à toute autre (lot 3). */
export const stageSchema = z.enum(["new", "contacted", "meeting", "won", "lost"]);

/** Nom obligatoire : une chaîne non vide une fois les espaces retirés. */
export const nameSchema = z.string({ error: NAME_REQUIRED }).trim().min(1, NAME_REQUIRED);

/** Champ texte facultatif : espaces retirés, absent ou vide → null. */
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

/** Email facultatif ; s'il est rempli, il doit être bien formé. */
const optionalEmail = z
  .string({ error: EMAIL_INVALID })
  .trim()
  .pipe(z.union([z.literal(""), z.email({ error: EMAIL_INVALID })]))
  .optional()
  .transform((value) => value || null);

/** Saisie de la fiche. Les champs inconnus (ex. champs techniques du formulaire) sont ignorés. */
export const contactFieldsSchema = z.preprocess(
  // Une saisie qui n'est pas un objet est traitée comme vide : le nom manquera.
  (input) => (typeof input === "object" && input !== null ? input : {}),
  z.object({
    name: nameSchema,
    company: optionalText,
    email: optionalEmail,
    phone: optionalText,
    notes: optionalText,
  }),
);

export type ContactFieldErrors = { name?: typeof NAME_REQUIRED; email?: typeof EMAIL_INVALID };

/** Erreurs zod → codes métier par champ (le premier code de chaque champ). */
export function toFieldErrors(error: z.ZodError): ContactFieldErrors {
  const { fieldErrors } = z.flattenError(error) as { fieldErrors: Record<string, string[] | undefined> };
  const errors: ContactFieldErrors = {};
  if (fieldErrors.name?.length) errors.name = NAME_REQUIRED;
  if (fieldErrors.email?.length) errors.email = EMAIL_INVALID;
  return errors;
}
