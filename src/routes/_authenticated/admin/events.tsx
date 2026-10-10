import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { EventsAdmin } from '@/components/admin/events';
export const Route = createFileRoute('/_authenticated/admin/events')({
  head: () => adminHead('Events', 'Manage events for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: EventsAdmin,
});
