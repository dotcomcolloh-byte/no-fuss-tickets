import { createFileRoute } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { adminHead } from '@/lib/admin-utils';
import { AttendanceAdmin } from '@/components/admin/attendance';
export const Route = createFileRoute('/_authenticated/admin/attendance')({
  head: () => adminHead('Attendance', 'Manage attendance for Tumdo Kalenjin Connect events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: AttendanceAdmin,
});
