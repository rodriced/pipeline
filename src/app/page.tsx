import { Suspense } from "react";
import { connection } from "next/server";
import { addContactAction } from "@/app/actions";
import { AddContactForm } from "@/components/add-contact-form";
import { ContactList } from "@/components/contact-list";
import { contactService } from "@/services/contact.service";

async function ContactsSection() {
  // La base est lue de façon synchrone : sans ça, la liste serait figée au prerender.
  await connection();
  const contacts = await contactService.listContacts();
  return <ContactList contacts={contacts} />;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Pipeline</h1>

      <section aria-labelledby="add-contact" className="flex flex-col gap-3">
        <h2 id="add-contact" className="text-lg">Ajouter un contact</h2>
        <AddContactForm action={addContactAction} />
      </section>

      <section aria-labelledby="contacts" className="flex flex-col gap-3">
        <h2 id="contacts" className="text-lg">Contacts</h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <ContactsSection />
        </Suspense>
      </section>
    </main>
  );
}
