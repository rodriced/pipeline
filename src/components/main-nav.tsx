// Couche présentation : navigation principale.
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

const LINKS = [
  { href: "/", label: "Contacts" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/aujourdhui", label: "Aujourd’hui" },
];

export function MainNav() {
  return (
    <nav aria-label="Navigation principale" className="border-b border-border">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-6 px-4 py-2 text-sm">
        <ul className="flex gap-6">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="text-muted-foreground hover:text-foreground">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ml-auto">
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
