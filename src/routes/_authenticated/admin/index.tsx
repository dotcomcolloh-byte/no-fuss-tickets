import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { DashboardAdmin } from '@/components/admin/dashboard';
export const Route = createFileRoute('/_authenticated/admin/')({
  head: () => adminHead('Dashboard', 'Manage dashboard for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: DashboardAdmin,
});
