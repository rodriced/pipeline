// Couche présentation : relances dues aujourd'hui ou en retard (lot 5). Composant pur :
// les relances et les actions serveur (déjà liées à chaque contact) sont reçues en props.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DueFollowUp } from "@/services/contact.service";

export type DueFollowUpItem = DueFollowUp;

type BoundAction = () => Promise<void>;

const lateLabel = (days: number) => `En retard de ${days} ${days > 1 ? "jours" : "jour"}`;

export function FollowUpList({
  items,
  markDone,
  postpone,
}: {
  items: DueFollowUpItem[];
  markDone: (contactId: number) => BoundAction;
  postpone: (contactId: number) => BoundAction;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Rien à faire aujourd’hui.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ contact, daysLate }) => {
        const late = daysLate > 0;
        return (
          <li key={contact.id} data-late={late || undefined}>
            <Card
              size="sm"
              className={cn(
                "shadow-card flex-row flex-wrap items-center justify-between gap-3 px-4",
                late && "border-l-4 border-l-today",
              )}
            >
              <div className="flex min-w-0 flex-col">
                <Link href={`/contacts/${contact.id}`} className="font-heading text-base hover:underline">
                  {contact.name}
                </Link>
                {contact.company && <span className="truncate text-sm text-muted-foreground">{contact.company}</span>}
                <span className={cn("text-sm text-today-foreground", late && "font-semibold")}>
                  {late ? lateLabel(daysLate) : "Aujourd’hui"}
                </span>
              </div>
              <div className="flex gap-2">
                <form action={markDone(contact.id)}>
                  <Button type="submit" size="sm">
                    Fait
                  </Button>
                </form>
                <form action={postpone(contact.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    Demain
                  </Button>
                </form>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
