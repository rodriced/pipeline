import { Suspense } from "react";
import type { Metadata } from "next";
import { PipelineSection } from "@/app/pipeline/pipeline-section";

export const metadata: Metadata = { title: "Pipeline · Pipeline" };

export default function PipelinePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Pipeline</h1>
      <p className="text-sm text-muted-foreground">
        Glissez une carte vers une autre colonne, ou utilisez « Déplacer vers… ».
      </p>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <PipelineSection />
      </Suspense>
    </main>
  );
}
