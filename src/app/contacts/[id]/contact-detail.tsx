// Couche présentation : contenu de la fiche contact (Server Component).
// Séparé de page.tsx pour être testable ; rendu sous <Suspense> car il lit les params.
import { notFound } from "next/navigation";
import { deleteContactAction, updateContactAction } from "@/app/actions";
import { ContactForm } from "@/components/contact-form";
import { DeleteContactDialog } from "@/components/delete-contact-dialog";
import { StageBadge } from "@/components/stage-badge";
import { contactService } from "@/services/contact.service";

/** Identifiant de l'URL → entier strictement positif, sinon null. */
function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (id === null) notFound();

  const contact = await contactService.getContact(id);
  if (!contact) notFound();

  return (
    <article className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">{contact.name}</h1>
          {contact.company && <p className="text-muted-foreground">{contact.company}</p>}
        </div>
        <StageBadge stage={contact.stage} />
      </header>

      <ContactForm
        action={updateContactAction.bind(null, contact.id)}
        initialState={{
          values: {
            name: contact.name,
            company: contact.company ?? "",
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            notes: contact.notes ?? "",
          },
        }}
      />

      <footer className="border-t border-border pt-6">
        <DeleteContactDialog contactName={contact.name} action={deleteContactAction.bind(null, contact.id)} />
      </footer>
    </article>
  );
}
