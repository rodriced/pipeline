"use client";

// Couche présentation : suppression avec confirmation. Le formulaire qui supprime
// n'existe que dans la fenêtre de confirmation ; « Annuler » la ferme sans rien envoyer.
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteContactDialog({
  contactName,
  action,
}: {
  contactName: string;
  action: () => Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>Supprimer</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {contactName} ?</AlertDialogTitle>
          <AlertDialogDescription>Le contact et sa fiche seront définitivement supprimés.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <form action={action}>
            <AlertDialogAction type="submit" variant="destructive">
              Supprimer
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
