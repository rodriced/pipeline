import { Suspense } from "react";
import Link from "next/link";
import { ContactDetail } from "@/app/contacts/[id]/contact-detail";

export default function ContactPage({ params }: PageProps<"/contacts/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Contacts
      </Link>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <ContactDetail params={params} />
      </Suspense>
    </main>
  );
}
