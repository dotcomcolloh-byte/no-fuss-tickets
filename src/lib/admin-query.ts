import { queryOptions } from '@tanstack/react-query';
import { getAdminData } from './admin.functions';
export const adminQuery = queryOptions({ queryKey: ['admin-records'], queryFn: () => getAdminData(), staleTime: 15000 });
export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
