// Couche présentation : colonnes du pipeline (Server Component), rendu sous <Suspense>.
// Séparé de page.tsx pour être testable.
import { connection } from "next/server";
import { changeStageAction } from "@/app/actions";
import { PipelineBoard } from "@/components/pipeline-board";
import { contactService } from "@/services/contact.service";

export async function PipelineSection() {
  // La base est lue de façon synchrone : sans ça, les colonnes seraient figées au prerender.
  await connection();
  const columns = await contactService.getPipelineBoard();
  return <PipelineBoard columns={columns} action={changeStageAction} />;
}
