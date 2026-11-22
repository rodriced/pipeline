// Couche présentation : filtres + liste des contacts (Server Component), rendu sous <Suspense>.
// Séparé de page.tsx pour être testable. Les paramètres d'URL sont transmis bruts au service (zod).
import { connection } from "next/server";
import { ContactFilters } from "@/components/contact-filters";
import { ContactList } from "@/components/contact-list";
import { contactService } from "@/services/contact.service";

export async function ContactsSection({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // La base est lue de façon synchrone : sans ça, la liste serait figée au prerender.
  await connection();
  const filters = contactService.parseContactFilters(params);
  const contacts = await contactService.searchContacts(params);

  return (
    <div className="flex flex-col gap-4">
      <ContactFilters q={filters.q} stage={filters.stage} />
      <ContactList contacts={contacts} filtered={filters.q !== "" || filters.stage !== null} />
    </div>
  );
}
