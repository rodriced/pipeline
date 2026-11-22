// Couche service : schémas zod des données d'un contact. C'est la validation côté serveur
// de tout ce qui arrive de l'extérieur (Server Actions, FormData) : forme et règles métier.
// Les messages des erreurs sont des codes métier ; la présentation les traduit.
import { z } from "zod";

const NAME_REQUIRED = "NAME_REQUIRED";
const NAME_TOO_LONG = "NAME_TOO_LONG";
const EMAIL_INVALID = "EMAIL_INVALID";
const COMPANY_TOO_LONG = "COMPANY_TOO_LONG";
const PHONE_TOO_LONG = "PHONE_TOO_LONG";
const NOTES_TOO_LONG = "NOTES_TOO_LONG";

/**
 * Longueurs maximales des champs texte, espaces retirés (#22). Sans authentification,
 * elles empêchent de remplir la base avec des saisies géantes. E-mail : limite RFC 5321.
 * Ce module n'importe que zod : les formulaires peuvent s'en servir côté client (maxLength).
 */
export const CONTACT_LIMITS = { name: 120, company: 160, email: 254, phone: 40, notes: 5000 } as const;

/** Longueur maximale d'une recherche ; au-delà, elle est ignorée. */
const SEARCH_MAX = 200;

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

/** Date seule AAAA-MM-JJ, existante au calendrier (pas de 30 février). */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  });

/** Première valeur d'un paramètre d'URL (?q=a&q=b → "a"). */
const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/**
 * Filtres de la liste, lus dans l'URL (searchParams) : recherche et étape (lot 6).
 * Une valeur absente ou invalide est ignorée (pas d'erreur : c'est un filtre).
 */
export const contactFiltersSchema = z.preprocess(
  (input) => (typeof input === "object" && input !== null ? input : {}),
  z.object({
    q: z.preprocess(firstValue, z.string().trim().max(SEARCH_MAX)).catch(""),
    stage: z.preprocess(firstValue, stageSchema.nullable()).catch(null),
  }),
);

/** Nom obligatoire : une chaîne non vide une fois les espaces retirés, de longueur bornée. */
export const nameSchema = z
  .string({ error: NAME_REQUIRED })
  .trim()
  .min(1, NAME_REQUIRED)
  .max(CONTACT_LIMITS.name, NAME_TOO_LONG);

/** Champ texte facultatif : espaces retirés, longueur bornée, absent ou vide → null. */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .optional()
    .transform((value) => value || null);

/** Email facultatif ; s'il est rempli, il doit être bien formé (et pas plus long que la limite). */
const optionalEmail = z
  .string({ error: EMAIL_INVALID })
  .trim()
  .max(CONTACT_LIMITS.email, EMAIL_INVALID)
  .pipe(z.union([z.literal(""), z.email({ error: EMAIL_INVALID })]))
  .optional()
  .transform((value) => value || null);

/** Saisie de la fiche. Les champs inconnus (ex. champs techniques du formulaire) sont ignorés. */
export const contactFieldsSchema = z.preprocess(
  // Une saisie qui n'est pas un objet est traitée comme vide : le nom manquera.
  (input) => (typeof input === "object" && input !== null ? input : {}),
  z.object({
    name: nameSchema,
    company: optionalText(CONTACT_LIMITS.company, COMPANY_TOO_LONG),
    email: optionalEmail,
    phone: optionalText(CONTACT_LIMITS.phone, PHONE_TOO_LONG),
    notes: optionalText(CONTACT_LIMITS.notes, NOTES_TOO_LONG),
  }),
);

export type ContactFieldErrors = {
  name?: typeof NAME_REQUIRED | typeof NAME_TOO_LONG;
  email?: typeof EMAIL_INVALID;
  company?: typeof COMPANY_TOO_LONG;
  phone?: typeof PHONE_TOO_LONG;
  notes?: typeof NOTES_TOO_LONG;
};

/** Code métier d'erreur sur le nom seul (ajout rapide d'un contact). */
export type NameError = typeof NAME_REQUIRED | typeof NAME_TOO_LONG;
export const nameErrorOf = (error: z.ZodError): NameError =>
  error.issues.some((issue) => issue.message === NAME_TOO_LONG) ? NAME_TOO_LONG : NAME_REQUIRED;

/** Erreurs zod → codes métier par champ (nom requis ou trop long, e-mail invalide, longueurs dépassées). */
export function toFieldErrors(error: z.ZodError): ContactFieldErrors {
  const { fieldErrors } = z.flattenError(error) as { fieldErrors: Record<string, string[] | undefined> };
  const has = (field: string, code: string) => fieldErrors[field]?.includes(code) ?? false;
  const errors: ContactFieldErrors = {};
  if (fieldErrors.name?.length) errors.name = has("name", NAME_TOO_LONG) ? NAME_TOO_LONG : NAME_REQUIRED;
  if (fieldErrors.email?.length) errors.email = EMAIL_INVALID;
  if (has("company", COMPANY_TOO_LONG)) errors.company = COMPANY_TOO_LONG;
  if (has("phone", PHONE_TOO_LONG)) errors.phone = PHONE_TOO_LONG;
  if (has("notes", NOTES_TOO_LONG)) errors.notes = NOTES_TOO_LONG;
  return errors;
}
