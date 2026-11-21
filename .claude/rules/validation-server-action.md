---
paths:
  - "src/app/**/actions.ts"
  - "src/services/**"
  - "__tests__/services/**"
  - "__tests__/app/**"
---

# Validation des entrées des Server Actions

Une Server Action est un point d'entrée HTTP public : tout ce qu'elle reçoit vient du client et peut être forgé.

## Règle
- Chaque donnée en entrée d'une Server Action (`"use server"`) est validée par un schéma zod avant tout usage métier :
  - les champs du `FormData` ;
  - les arguments passés à l'appel ;
  - les arguments liés par `.bind(...)` ;
  - l'état précédent de `useActionState` (`prevState`), s'il est utilisé.
- Aucune donnée non validée n'est utilisée : pas de cast (`as string`, `as number`), pas de `!`, pas de `String(...)`/`Number(...)` en guise de validation.

## Où valider
- Les schémas zod vivent dans la couche service (`src/services/*.schema.ts`) : la validation est une règle métier (voir `service.md`), et la couche service s'exécute côté serveur.
- Les méthodes de service appelées par une action reçoivent des entrées `unknown` et les passent par `schema.safeParse(...)`.
- L'action transmet la donnée brute au service (`formData.get("name")`, `Object.fromEntries(formData)`, argument lié) sans la retoucher. Elle ne relit le `FormData` que pour renvoyer la saisie au formulaire.
- Les erreurs de validation sont des codes métier (`NAME_REQUIRED`, `EMAIL_INVALID`…). La présentation les traduit en messages.
- Les champs inconnus sont ignorés (comportement par défaut de `z.object`), jamais transmis à la base.

## Tests
- Chaque schéma a des tests d'entrées malformées, écrits avant le code : entrée non-objet, champ manquant, mauvais type, valeur vide ou faite d'espaces, champs inconnus.
- Une entrée malformée renvoie une erreur métier, jamais une exception (`TypeError`…).

## Comment vérifier
- Lister les Server Actions et relire chaque paramètre : `grep -rln '"use server"' src`.
- Aucun cast de donnée reçue dans les actions : `grep -rnE "as (string|number)|\.get\([^)]*\)!|Number\(|String\(" src/app --include="actions.ts"` → vide.
- Chaque méthode de service appelée par une action valide son entrée avec zod : `grep -rn "safeParse" src/services`.
- `pnpm test __tests__/services` passe, entrées malformées comprises.
