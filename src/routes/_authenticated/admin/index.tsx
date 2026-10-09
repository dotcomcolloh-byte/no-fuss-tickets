import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ksh, fmtDateTime } from "@/lib/format";
import { PageTitle, StatusPill } from "./route";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dash"],
    queryFn: async () => {
      const [p, t] = await Promise.all([
        supabase.from("payments").select("transaction_ref, amount, status, created_at, orders(customers(full_name, email), events(name))").order("created_at", { ascending: false }),
        supabase.from("tickets").select("status"),
      ]);
      return { pays: p.data ?? [], tickets: t.data ?? [] };
    },
  });
  const pays = data?.pays ?? [];
  const tickets = data?.tickets ?? [];
  const sales = pays.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const cards = [
    ["Total Sales", ksh(sales)],
    ["Tickets Sold", tickets.length],
    ["Attendance", tickets.filter((t) => t.status === "used").length],
    ["Pending Payments", pays.filter((p) => p.status === "pending" || p.status === "processing").length],
  ];
  return (
    <div>
      <PageTitle title="Dashboard" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-2xl font-black">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mb-2 mt-6 font-bold">Recent Transactions</h2>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs"><tr><th className="p-3">Date</th><th>Customer</th><th>Event</th><th>Amount</th><th>Ref</th><th>Status</th></tr></thead>
          <tbody>
            {pays.map((p) => {
              const o = p.orders as unknown as { customers: { full_name: string }; events: { name: string } };
              return (
                <tr key={p.transaction_ref} className="border-t">
                  <td className="p-3">{fmtDateTime(p.created_at)}</td><td>{o?.customers?.full_name}</td><td>{o?.events?.name}</td><td>{ksh(p.amount)}</td><td className="font-mono text-xs">{p.transaction_ref}</td><td><StatusPill s={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
