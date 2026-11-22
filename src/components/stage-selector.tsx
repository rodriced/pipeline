// Couche présentation : changement d'étape depuis la fiche (lot 3).
// Un bouton d'envoi par étape : fonctionne aussi sans JavaScript. L'action serveur est reçue en props.
import { STAGE_OPTIONS } from "@/components/stage-badge";
import { Button } from "@/components/ui/button";
import type { Stage } from "@/services/contact.service";

export function StageSelector({
  stage: current,
  action,
}: {
  stage: Stage;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} aria-label="Étape du contact" className="flex flex-wrap gap-2">
      {STAGE_OPTIONS.map(({ stage, label }) => {
        const isCurrent = stage === current;
        return (
          <Button
            key={stage}
            type="submit"
            name="stage"
            value={stage}
            size="sm"
            variant={isCurrent ? "default" : "outline"}
            aria-pressed={isCurrent}
            disabled={isCurrent}
          >
            {label}
          </Button>
        );
      })}
    </form>
  );
}
