import { StatusBadge } from "@/components/status-badge";
import { statusService } from "@/services/status.service";

export default async function StatusPage() {
  const status = await statusService.getAppStatus();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2">
      <h1 className="text-xl font-semibold">Statut</h1>
      <StatusBadge status={status} />
    </main>
  );
}
