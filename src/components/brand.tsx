import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Ticket, CalendarDays, ShoppingCart } from "lucide-react";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

export function Logo({ className, light = true }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg text-lg font-black italic leading-none",
          light ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground",
        )}
      >
        TK
      </span>
      <span className={cn("leading-none", light ? "text-primary-foreground" : "text-foreground")}>
        <span className="block text-[13px] font-extrabold tracking-wide">TUMDO KALENJIN</span>
        <span className="block text-[9px] font-bold tracking-[0.35em] opacity-90">CONNECT</span>
      </span>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-red">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/events" aria-label="Search events" className="rounded-full p-2 hover:bg-primary-foreground/15">
            <Search className="h-5 w-5" />
          </Link>
          <Link to="/tickets" aria-label="My tickets" className="rounded-full p-2 hover:bg-primary-foreground/15">
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Search", icon: Search },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/events", label: "Events", icon: CalendarDays, search: { view: "all" } },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-primary text-primary-foreground md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map((n, i) => {
          const active = i === 0 ? path === "/" : i === 2 ? path.startsWith("/tickets") : i === 1 ? path === "/events" : false;
          const Icon = n.icon;
          return (
            <Link
              key={n.label}
              to={n.to}
              className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold opacity-80", active && "opacity-100")}
            >
              <Icon className="h-5 w-5" />
              {n.label}
              {active && <span className="mt-0.5 h-0.5 w-6 rounded bg-primary-foreground" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SiteHeader />
      <main className="mx-auto max-w-5xl">{children}</main>
      <footer className="mx-auto hidden max-w-5xl px-4 py-8 text-center text-xs text-muted-foreground md:block">
        Tumdo Kalenjin Connect · Events. Tickets. Memories. ·{" "}
        <Link to="/organiser/login" className="underline">
          Organiser login
        </Link>
      </footer>
    </div>
  );
}

export function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) QRCode.toCanvas(ref.current, value, { width: size, margin: 1, errorCorrectionLevel: "M" });
  }, [value, size]);
  return <canvas ref={ref} width={size} height={size} aria-label="Ticket QR code" />;
}
