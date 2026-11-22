// Couche présentation : relances dues (Server Component), rendu sous <Suspense>.
// Séparé de page.tsx pour être testable.
import { connection } from "next/server";
import { markFollowUpDoneAction, postponeFollowUpAction } from "@/app/actions";
import { FollowUpList } from "@/components/follow-up-list";
import { contactService } from "@/services/contact.service";

export async function TodaySection() {
  // « Aujourd'hui » dépend de la date de la requête : pas de rendu figé au prerender.
  await connection();
  const items = await contactService.listDueFollowUps();

  return (
    <FollowUpList
      items={items}
      markDone={(id) => markFollowUpDoneAction.bind(null, id)}
      postpone={(id) => postponeFollowUpAction.bind(null, id)}
    />
  );
}
