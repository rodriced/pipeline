// Couche présentation : contenu de la fiche contact (Server Component).
// Séparé de page.tsx pour être testable ; rendu sous <Suspense> car il lit les params.
import { notFound } from "next/navigation";
import { deleteContactAction, updateContactAction } from "@/app/actions";
import { ContactForm } from "@/components/contact-form";
import { DeleteContactDialog } from "@/components/delete-contact-dialog";
import { StageBadge } from "@/components/stage-badge";
import { contactService } from "@/services/contact.service";

export async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  // Identifiant de l'URL transmis brut : le service le valide (zod) et renvoie null s'il est invalide.
  const contact = await contactService.getContact((await params).id);
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
