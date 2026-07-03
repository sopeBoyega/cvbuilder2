import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resumes", label: "Resumes" },
  { href: "/templates", label: "Templates" },
  { href: "/tailor", label: "Tailor" },
  { href: "/applications", label: "Applications" },
  { href: "/insights", label: "Insights" },
  { href: "/settings/profile", label: "Settings" },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh bg-zinc-50 text-zinc-950">
      <aside className="hidden w-64 border-r border-zinc-200 bg-white px-4 py-6 lg:block">
        <Link href="/dashboard" className="text-lg font-semibold">
          CV Builder
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-sm font-medium text-zinc-600">
              Protected workspace
            </span>
            <Link
              href="/settings/profile"
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium"
            >
              Profile
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
