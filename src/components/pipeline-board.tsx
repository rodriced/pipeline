"use client";

// Couche présentation : vue Pipeline en colonnes (lot 7). Une colonne par étape, ses contacts en cartes.
// Déplacer un contact : au clavier (et sans JavaScript) par la liste « Déplacer vers… » de chaque carte,
// à la souris par glisser-déposer. Les deux appellent la même action serveur (changeStage, validée par zod).
import Link from "next/link";
import { useOptimistic, useState, useTransition, type DragEvent } from "react";
import { formatDayMonth } from "@/components/format-date";
import { STAGE_OPTIONS } from "@/components/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import type { Contact, PipelineColumn as Column, Stage } from "@/services/contact.service";

export type PipelineColumn = Column;

type MoveAction = (contactId: unknown, formData: FormData) => Promise<void>;

const LABELS = Object.fromEntries(STAGE_OPTIONS.map((o) => [o.stage, o.label])) as Record<Stage, string>;
const byMostRecent = (a: Contact, b: Contact) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id;
const DRAG_TYPE = "application/x-pipeline-contact";

/** Déplacement affiché tout de suite, avant la réponse du serveur (qui fait foi ensuite). */
function moveLocally(board: Column[], { id, to }: { id: number; to: Stage }): Column[] {
  const contact = board.flatMap((column) => column.contacts).find((c) => c.id === id);
  if (!contact || contact.stage === to) return board;
  const moved = { ...contact, stage: to };
  return board.map((column) => {
    const others = column.contacts.filter((c) => c.id !== id);
    return { ...column, contacts: column.stage === to ? [...others, moved].sort(byMostRecent) : others };
  });
}

function ContactCard({ contact, action }: { contact: Contact; action: MoveAction }) {
  function onDragStart(event: DragEvent<HTMLLIElement>) {
    event.dataTransfer.setData(DRAG_TYPE, String(contact.id));
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <li draggable data-contact-id={contact.id} onDragStart={onDragStart} className="cursor-grab active:cursor-grabbing">
      <Card size="sm" className="shadow-card gap-2 px-3">
        <div className="flex min-w-0 flex-col">
          <Link href={`/contacts/${contact.id}`} className="font-heading text-base break-words hover:underline">
            {contact.name}
          </Link>
          {contact.company && <span className="truncate text-sm text-muted-foreground">{contact.company}</span>}
          {contact.nextFollowUp && (
            <span className="text-sm text-muted-foreground">Relance : {formatDayMonth(contact.nextFollowUp)}</span>
          )}
        </div>
        <form action={action.bind(null, contact.id)} className="flex items-center gap-2">
          <NativeSelect
            name="stage"
            size="sm"
            defaultValue=""
            required
            aria-label={`Déplacer ${contact.name} vers`}
            className="min-w-0 flex-1"
          >
            <NativeSelectOption value="" disabled>
              Déplacer vers…
            </NativeSelectOption>
            {STAGE_OPTIONS.filter((o) => o.stage !== contact.stage).map((o) => (
              <NativeSelectOption key={o.stage} value={o.stage}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="submit" size="sm" variant="outline">
            Déplacer
          </Button>
        </form>
      </Card>
    </li>
  );
}

export function PipelineBoard({ columns, action }: { columns: Column[]; action: MoveAction }) {
  const [board, moveOptimistically] = useOptimistic(columns, moveLocally);
  const [, startTransition] = useTransition();
  const [dropTarget, setDropTarget] = useState<Stage | null>(null);

  function onDrop(event: DragEvent<HTMLElement>, to: Stage) {
    event.preventDefault();
    setDropTarget(null);
    const id = Number(event.dataTransfer.getData(DRAG_TYPE));
    if (!Number.isInteger(id) || id <= 0) return;
    const formData = new FormData();
    formData.set("stage", to);
    startTransition(async () => {
      moveOptimistically({ id, to });
      await action(id, formData);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {board.map(({ stage, contacts }) => (
        <section
          key={stage}
          data-stage={stage}
          aria-labelledby={`column-${stage}`}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropTarget(stage);
          }}
          onDragLeave={() => setDropTarget((current) => (current === stage ? null : current))}
          onDrop={(event) => onDrop(event, stage)}
          className={cn(
            "flex w-64 shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3 transition-colors",
            dropTarget === stage && "bg-muted ring-2 ring-primary",
          )}
        >
          <h2 id={`column-${stage}`} className="flex items-center justify-between text-base">
            <span>{LABELS[stage]}</span>
            <Badge variant="secondary">{contacts.length}</Badge>
          </h2>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun contact</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} action={action} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
