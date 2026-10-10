import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { RecordsAdmin } from '@/components/admin/records';
export const Route = createFileRoute('/_authenticated/admin/orders')({
  head: () => adminHead('Orders & Tickets', 'Manage orders & tickets for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: RecordsAdmin,
});
