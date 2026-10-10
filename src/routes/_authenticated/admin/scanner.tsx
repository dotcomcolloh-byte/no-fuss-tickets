import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { ScannerAdmin } from '@/components/admin/scanner';
export const Route = createFileRoute('/_authenticated/admin/scanner')({
  head: () => adminHead('Ticket Scanner', 'Manage ticket scanner for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: ScannerAdmin,
});
