// Couche présentation : affichage des dates seules (AAAA-MM-JJ) reçues du service.

/** « 2026-11-25 » → « 25/11 ». */
export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}
