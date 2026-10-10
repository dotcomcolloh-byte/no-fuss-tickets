import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { RecordsAdmin } from '@/components/admin/records';
export const Route = createFileRoute('/_authenticated/admin/payments')({
  head: () => adminHead('Payment Records', 'Manage payment records for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: () => <RecordsAdmin payments />,
});
