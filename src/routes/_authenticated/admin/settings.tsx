import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { SettingsAdmin } from '@/components/admin/settings';
export const Route = createFileRoute('/_authenticated/admin/settings')({
  head: () => adminHead('Settings', 'Manage settings for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: SettingsAdmin,
});
