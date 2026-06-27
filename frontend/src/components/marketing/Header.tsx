import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/", label: "Home" },
  { href: "/survey/1", label: "Product tour" },
  { href: "/demo", label: "Live demo" },
  { href: "/app", label: "Dashboard" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo href="/" showTagline size="md" />
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#4B5563] transition-colors hover:text-[#0B5FFF]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/survey/1">
            <Button size="sm">Start free survey</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
