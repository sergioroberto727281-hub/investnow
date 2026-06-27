import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-6 rounded-sm bg-primary" />
          <span className="font-display text-lg font-bold tracking-tight">INVESTWISE</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-semibold hover:text-primary">
                Log in
              </Link>
              <Button asChild size="sm">
                <Link to="/auth" search={{ tab: "register" } as never}>
                  Start Investing
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((s) => !s)}
          className="md:hidden p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium py-2"
              >
                {n.label}
              </Link>
            ))}
            <div className="border-t border-border pt-3 flex flex-col gap-2">
              {user ? (
                <Button asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth">Start Investing</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-background py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-6 flex items-center gap-2">
            <div className="size-5 rounded-sm bg-primary" />
            <span className="font-display text-lg font-bold tracking-tight">INVESTWISE</span>
          </div>
          <p className="mb-8 max-w-xs text-sm text-foreground/40">
            Premium wealth management infrastructure for retail and institutional investors.
          </p>
          <div className="space-y-2 text-[10px] uppercase tracking-tighter leading-relaxed text-foreground/30">
            <p>Investment involves risk. Past performance is not indicative of future results.</p>
            <p>© {new Date().getFullYear()} InvestWise Financial Services. All rights reserved.</p>
          </div>
        </div>
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-primary">Platform</h5>
          <ul className="space-y-2 text-sm text-foreground/60">
            <li><Link to="/plans" className="hover:text-foreground">Investment Plans</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign In</Link></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-primary">Legal</h5>
          <ul className="space-y-2 text-sm text-foreground/60">
            <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
            <li><a href="#" className="hover:text-foreground">Risk Disclosures</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  // re-render header on route change so active link reacts
  useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
