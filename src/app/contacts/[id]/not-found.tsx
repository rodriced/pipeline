import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Contact introuvable</h1>
      <p className="text-muted-foreground">Ce contact n’existe pas ou a été supprimé.</p>
      <Button render={<Link href="/" />} nativeButton={false} variant="outline">
        Retour aux contacts
      </Button>
    </div>
  );
}
