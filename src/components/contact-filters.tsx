// Couche présentation : recherche et filtre par étape (lot 6).
// Formulaire GET : les filtres vont dans l'URL, donc survivent au rechargement et se partagent.
import Link from "next/link";
import { STAGE_OPTIONS } from "@/components/stage-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Stage } from "@/services/contact.service";

export function ContactFilters({ q, stage }: { q: string; stage: Stage | null }) {
  const active = q !== "" || stage !== null;

  return (
    <form method="get" action="/" role="search" className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-48 flex-1 flex-col gap-2">
        <Label htmlFor="contact-search">Rechercher</Label>
        <Input id="contact-search" name="q" type="search" defaultValue={q} placeholder="Nom ou entreprise" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-stage">Étape</Label>
        <NativeSelect id="contact-stage" name="stage" defaultValue={stage ?? ""}>
          <NativeSelectOption value="">Toutes les étapes</NativeSelectOption>
          {STAGE_OPTIONS.map((option) => (
            <NativeSelectOption key={option.stage} value={option.stage}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" variant="outline">
        Filtrer
      </Button>
      {active && (
        <Link href="/" className="self-center text-sm text-muted-foreground hover:text-foreground">
          Réinitialiser
        </Link>
      )}
    </form>
  );
}
