import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { TicketTypesAdmin } from '@/components/admin/ticket-types';
export const Route = createFileRoute('/_authenticated/admin/ticket-types')({
  head: () => adminHead('Ticket Types', 'Manage ticket types for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: TicketTypesAdmin,
});
