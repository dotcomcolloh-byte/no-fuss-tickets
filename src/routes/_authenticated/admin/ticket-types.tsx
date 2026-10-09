import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "./route";

export const Route = createFileRoute("/_authenticated/admin/ticket-types")({ component: Page });

function Page() {
  return (
    <div>
      <PageTitle title="Ticket types" />
      <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">This section is coming next.</p>
    </div>
  );
}
