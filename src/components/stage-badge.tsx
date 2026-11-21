// Couche présentation : badge d'étape, couleurs issues des tokens stage-* du thème.
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Stage } from "@/services/contact.service";

// Classes complètes et statiques, pour que Tailwind les détecte.
const STAGES: Record<Stage, { label: string; className: string }> = {
  new: { label: "Nouveau", className: "text-stage-new bg-stage-new/14" },
  contacted: { label: "Contacté", className: "text-stage-contacted bg-stage-contacted/14" },
  meeting: { label: "RDV", className: "text-stage-meeting bg-stage-meeting/14" },
  won: { label: "Gagné", className: "text-stage-won bg-stage-won/14" },
  lost: { label: "Perdu", className: "text-stage-lost bg-stage-lost/14" },
};

export function StageBadge({ stage }: { stage: Stage }) {
  const { label, className } = STAGES[stage];
  return (
    <Badge
      data-stage={stage}
      className={cn("gap-1.5 before:size-1.5 before:rounded-full before:bg-current", className)}
    >
      {label}
    </Badge>
  );
}
