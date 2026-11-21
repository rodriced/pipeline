import { Suspense } from "react";
import type { Metadata } from "next";
import { TodaySection } from "@/app/aujourdhui/today-section";

export const metadata: Metadata = { title: "Aujourd’hui · Pipeline" };

export default function TodayPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Aujourd’hui</h1>
      <p className="text-sm text-muted-foreground">Relances du jour et relances en retard.</p>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <TodaySection />
      </Suspense>
    </main>
  );
}
