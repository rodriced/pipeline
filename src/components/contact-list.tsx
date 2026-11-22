// Couche présentation : composant pur, reçoit la liste déjà triée en props.
import Link from "next/link";
import { formatDayMonth } from "@/components/format-date";
import { StageBadge } from "@/components/stage-badge";
import { Card } from "@/components/ui/card";
import type { Contact } from "@/services/contact.service";

export function ContactList({ contacts, filtered = false }: { contacts: Contact[]; filtered?: boolean }) {
  if (contacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{filtered ? "Aucun résultat." : "Aucun contact pour l’instant."}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <Link
            href={`/contacts/${contact.id}`}
            className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card
              size="sm"
              className="shadow-card flex-row items-center justify-between px-4 transition-colors hover:bg-muted/50"
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-heading text-base">{contact.name}</span>
                {contact.company && (
                  <span className="truncate text-sm text-muted-foreground">{contact.company}</span>
                )}
                {contact.nextFollowUp && (
                  <span className="text-sm text-muted-foreground">Relance : {formatDayMonth(contact.nextFollowUp)}</span>
                )}
              </span>
              <StageBadge stage={contact.stage} />
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
