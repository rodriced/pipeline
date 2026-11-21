import { Suspense } from "react";
import { addContactAction } from "@/app/actions";
import { ContactsSection } from "@/app/contacts-section";
import { AddContactForm } from "@/components/add-contact-form";

export default function Home({ searchParams }: PageProps<"/">) {
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
          <ContactsSection searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}
