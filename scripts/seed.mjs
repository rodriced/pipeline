// Jeu de test : `pnpm seed`.
// Insère des contacts couvrant les cas du pipeline (étapes, relances en retard / du jour / à venir / absentes,
// fiches vides ou complètes, recherche accentuée, homonymes, textes longs).
// - Dates relatives au jour d'exécution (création et relances).
// - Rejouable : un contact dont le nom existe déjà est ignoré ; rien n'est jamais supprimé.
// - Base : PIPELINE_DB_PATH, sinon ./data/pipeline.db. Les migrations sont appliquées par openDatabase.
import { join } from "node:path";
import { openDatabase } from "../src/data/db.ts";

const STAGES = ["new", "contacted", "meeting", "won", "lost"];
const CLOSED = ["won", "lost"];

// [nom, étape, créé il y a N jours, entreprise, email, téléphone, notes, relance dans N jours (négatif = retard, null = aucune)]
const CONTACTS = [
  // — Nouveaux
  ["Léa Martin", "new", 1, "Studio Kao", null, null, "Recommandée par Paul.", null],
  ["Hugo Bernard", "new", 2, null, "hugo.bernard@mail.fr", null, null, 0],
  ["Rémi Fontaine", "new", 0, "Fontaine Paysages", null, "06 70 80 90 10", "Ajouté aujourd'hui, à appeler dans la journée.", 0],
  ["Clara Vidal", "new", 5, null, null, null, null, -2],
  ["Gaston Lebrun", "new", 90, null, null, null, "Carte de visite trouvée, jamais contacté.", -45],
  ["Yasmine Benali", "new", 3, null, null, "07 12 12 12 12", null, null],
  // — Contactés
  ["Zoé Leroy", "contacted", 12, "Durandal SA", "zoe.leroy@durandal.fr", "06 11 22 33 44", "Intéressée, attend le budget 2027.", -3],
  ["Karim Haddad", "contacted", 9, "Haddad & Fils", null, "07 98 76 54 32", null, -1],
  ["Inès Moreau", "contacted", 6, "Atelier Lumen", "ines@atelier-lumen.fr", null, "Rappeler après le salon.", 2],
  ["Bruno Caron", "contacted", 7, "Atelier Lumen", "bruno@atelier-lumen.fr", null, "Même entreprise qu'Inès Moreau : se coordonner.", 1],
  ["Thomas Petit", "contacted", 20, "Petit Conseil", "thomas@petitconseil.fr", "06 55 44 33 22", "Fiche complète, aucune relance prévue.", null],
  ["Paul Martin", "contacted", 18, null, "paul.martin@mail.fr", null, "Homonyme partiel de Léa Martin (recherche « martin »).", 14],
  ["Martine Roy", "contacted", 11, "Roy Immobilier", null, null, "Son prénom contient « martin » : remonte aussi dans la recherche.", null],
  ["Jean-Baptiste N'Diaye", "contacted", 60, "N'Diaye Import-Export", "jb.ndiaye@ndiaye-ie.com", "+33 6 45 67 89 01", "Contacté il y a deux mois, plus de nouvelles (contact dormant).", null],
  ["Lucie Arnaud", "contacted", 35, "Arnaud Traiteur", null, null, "Perdue en octobre (budget gelé), rouverte : le budget est revenu.", 1],
  // — RDV
  ["Éloïse Durand", "meeting", 15, "Maison Durand", "eloise@maison-durand.fr", "06 12 34 56 78", "RDV fait, envoyer la proposition.", 0],
  ["Marc Lefèvre", "meeting", 30, "Lefèvre Bâtiment", null, null, "Relance oubliée depuis longtemps.", -10],
  ["Sophie Garnier", "meeting", 8, "Garnier Studio", "sophie@garnier.studio", null, null, 7],
  ["Nathan Roux", "meeting", 4, null, null, null, "RDV prévu, pas encore de relance.", null],
  ["Émile Zola", "meeting", 21, "Éditions Fasquelle", "emile@fasquelle.fr", null, "Recherche sans accents : « emile », « editions ».", 30],
  [
    "Anne-Sophie de La Tour d'Auvergne",
    "meeting",
    10,
    "Compagnie Générale des Établissements de Restauration Collective et d'Hôtellerie du Grand Ouest",
    "anne-sophie.delatourdauvergne@compagnie-generale-restauration-grand-ouest.fr",
    "+33 2 99 00 11 22",
    "Nom et entreprise très longs (affichage).\nNotes sur plusieurs lignes :\n- budget validé en comité\n- décision finale le mois prochain\n- interlocutrice technique : M. Le Gall",
    -5,
  ],
  // — Gagnés
  ["Camille Faure", "won", 45, "Faure Design", "camille@faure.design", "06 01 02 03 04", "Contrat signé le mois dernier.", null],
  ["Julien Blanc", "won", 60, "Blanc & Associés", null, null, null, null],
  ["Océane Robin", "won", 1, "Robin Événements", "oceane@robin-evenements.fr", null, "Signé hier !", null],
  ["Victor Hugues", "won", 120, null, null, null, null, null],
  // — Perdus
  ["Chloé Mercier", "lost", 40, "Mercier Industrie", "chloe@mercier-ind.fr", null, "A choisi un concurrent.", null],
  ["Antoine Girard", "lost", 25, null, null, null, "Pas de budget.", null],
  ["Margaux Lambert", "lost", 3, "Lambert Optique", "margaux@lambert-optique.fr", "06 98 98 98 98", "Perdu cette semaine : délai trop court.", null],
];

const pad = (n) => String(n).padStart(2, "0");
/** Date locale + N jours, au format AAAA-MM-JJ (comme le service). */
function localDatePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const daysAgoIso = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

// Cohérence avec les règles métier : étape connue, pas de relance sur un contact clôturé.
for (const [name, stage, , , , , , followUp] of CONTACTS) {
  if (!STAGES.includes(stage)) throw new Error(`${name} : étape inconnue « ${stage} »`);
  if (CLOSED.includes(stage) && followUp !== null) throw new Error(`${name} : un contact clôturé n'a pas de relance`);
}

const path = process.env.PIPELINE_DB_PATH ?? join(process.cwd(), "data", "pipeline.db");
const db = openDatabase(path);
const exists = db.prepare("SELECT 1 FROM contacts WHERE name = ?");
const insert = db.prepare(
  `INSERT INTO contacts (name, stage, created_at, company, email, phone, notes, next_follow_up)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

let added = 0;
let skipped = 0;
db.exec("BEGIN");
try {
  for (const [name, stage, createdDaysAgo, company, email, phone, notes, followUp] of CONTACTS) {
    if (exists.get(name)) {
      skipped++;
      continue;
    }
    insert.run(
      name,
      stage,
      daysAgoIso(createdDaysAgo),
      company,
      email,
      phone,
      notes,
      followUp === null ? null : localDatePlus(followUp),
    );
    added++;
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

console.log(`Jeu de test : ${added} contact(s) ajouté(s), ${skipped} déjà présent(s). Base : ${path}`);
