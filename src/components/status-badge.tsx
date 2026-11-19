// Couche présentation : composant pur, reçoit ses données en props.
import type { AppStatus } from "@/services/status.service";

export function StatusBadge({ status }: { status: AppStatus }) {
  return <span data-status={status}>{status}</span>;
}
