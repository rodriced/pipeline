// Couche présentation : composant pur, reçoit la liste déjà triée en props.
import { StageBadge } from "@/components/stage-badge";
import { Card } from "@/components/ui/card";
import type { Contact } from "@/services/contact.service";

export function ContactList({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun contact pour l’instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <Card size="sm" className="shadow-card flex-row items-center justify-between px-4">
            <span className="font-heading text-base">{contact.name}</span>
            <StageBadge stage={contact.stage} />
          </Card>
        </li>
      ))}
    </ul>
  );
}
