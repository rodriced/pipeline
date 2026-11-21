// Couche présentation : navigation principale.
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Contacts" },
  { href: "/aujourdhui", label: "Aujourd’hui" },
];

export function MainNav() {
  return (
    <nav aria-label="Navigation principale" className="border-b border-border">
      <ul className="mx-auto flex w-full max-w-2xl gap-6 px-4 py-3 text-sm">
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="text-muted-foreground hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
