import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, CalendarDays, Ticket, ShoppingBag, CreditCard, Users, ScanLine, Settings, LogOut, Menu, X, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Organiser Dashboard — Tumdo Kalenjin Connect" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/ticket-types", label: "Ticket Types", icon: Tags },
  { to: "/admin/orders", label: "Orders & Tickets", icon: ShoppingBag },
  { to: "/admin/payments", label: "Payment Records", icon: CreditCard },
  { to: "/admin/attendance", label: "Attendance", icon: Users },
  { to: "/admin/scanner", label: "Ticket Scanner", icon: ScanLine },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: isStaff, isLoading } = useQuery({
    queryKey: ["is-staff"],
    queryFn: async () => (await supabase.rpc("is_staff")).data === true,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/organiser/login", replace: true });
  }

  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!isStaff)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-bold">This account doesn't have organiser access.</p>
          <button onClick={signOut} className="mt-4 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">Sign out</button>
        </div>
      </div>
    );

  const menu = (
    <nav className="space-y-1 p-3">
      {NAV.map((n) => {
        const active = "exact" in n ? path === n.to || path === n.to + "/" : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-primary text-primary-foreground shadow-red" : "hover:bg-accent")}>
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        );
      })}
      <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-primary px-4 text-primary-foreground shadow-red">
        <Link to="/admin"><Logo /></Link>
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        <Link to="/" className="hidden text-xs font-semibold underline lg:block">View public site</Link>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r bg-card lg:block">{menu}</aside>
        {open && <div className="fixed inset-x-0 top-14 z-30 border-b bg-card shadow-card lg:hidden">{menu}</div>}
        <main className="min-w-0 flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-black">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function StatusPill({ s }: { s: string }) {
  const c: Record<string, string> = {
    paid: "bg-success/15 text-success", valid: "bg-success/15 text-success", published: "bg-success/15 text-success", verified: "bg-success/15 text-success", admitted: "bg-success/15 text-success",
    pending: "bg-warning/20 text-warning-foreground", processing: "bg-warning/20 text-warning-foreground", draft: "bg-warning/20 text-warning-foreground", unverified: "bg-warning/20 text-warning-foreground",
    used: "bg-muted text-muted-foreground", unpublished: "bg-muted text-muted-foreground",
  };
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-bold capitalize", c[s] ?? "bg-destructive/15 text-destructive")}>{s.replace(/_/g, " ")}</span>;
}
