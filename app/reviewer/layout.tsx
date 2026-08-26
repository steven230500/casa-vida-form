import Link from "next/link";
import { signout } from "@/app/login/actions";
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/session";
import { LogoMark } from "@/components/brand/logo-mark";

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = session?.role ?? "user";

  return (
    <div className="admin-theme min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-foreground/10 bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/reviewer" className="flex items-center gap-2">
                <LogoMark className="size-6" />
                <span className="font-semibold text-sm tracking-[0.2em] uppercase">
                  Revisión
                </span>
              </Link>
              <nav className="ml-10 hidden md:flex space-x-6 items-center">
                <Link
                  href="/reviewer"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Bandeja
                </Link>
                {role === "admin" && (
                  <Link
                    href="/admin/forms"
                    className="rounded-full border border-foreground/15 bg-beige px-4 py-1.5 text-sm font-medium text-beige-foreground transition-colors hover:bg-beige/70"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <form action={signout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
