import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const getAdminData = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = context.supabase;
  const { data: allowed } = await db.rpc('is_staff');
  if (!allowed) throw new Error('Organiser access required');
  const [events, types, orders, payments, tickets, scans, organisers, emails] = await Promise.all([
    db.from('events').select('*').order('event_date', { ascending: false }),
    db.from('ticket_types').select('*').order('sort_order'),
    db.from('orders').select('*, customers(full_name,email,phone), events(name), order_items(quantity,unit_price,ticket_types(name))').order('created_at', { ascending: false }),
    db.from('payments').select('*, orders(order_ref,event_id,customers(full_name,email,phone),events(name),order_items(quantity,ticket_types(name)))').order('created_at', { ascending: false }),
    db.from('tickets').select('*, customers(full_name,email), events(name), ticket_types(name)').order('created_at', { ascending: false }),
    db.from('ticket_scans').select('*, tickets(ticket_code,customers(full_name)), events(name)').order('scanned_at', { ascending: false }).limit(500),
    db.from('organisers').select('*').order('created_at'),
    db.from('email_logs').select('id,subject,status,error,created_at').order('created_at', { ascending: false }).limit(50),
  ]);
  for (const result of [events, types, orders, payments, tickets, scans, organisers, emails]) if (result.error) throw new Error('Could not load organiser records. Please refresh.');
  return { events: events.data ?? [], types: types.data ?? [], orders: orders.data ?? [], payments: payments.data ?? [], tickets: tickets.data ?? [], scans: scans.data ?? [], organisers: organisers.data ?? [], emails: emails.data ?? [], userId: context.userId };
});

export const eventSchema = z.object({
  id: z.string().uuid().optional(), organiser_id: z.string().uuid().nullable(),
  name: z.string().trim().min(2).max(150), event_type: z.enum(['Music','Festivals','Comedy','Sports','Conferences','Cultural']),
  description: z.string().max(10000), cover_image_url: z.string().max(2000).refine(v => !v || v.startsWith('/__l5e/assets-v1/') || /^https:\/\//.test(v), 'Use an HTTPS image URL'),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), start_time: z.string().nullable(), end_time: z.string().nullable(),
  venue: z.string().trim().min(2).max(200), location: z.string().trim().min(2).max(200),
  status: z.enum(['draft','published','unpublished','cancelled']), featured: z.boolean(), require_id: z.boolean(),
}).refine(v => !v.start_time || !v.end_time || v.end_time > v.start_time, 'End time must be after start time');
export const saveEvent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => eventSchema.parse(input)).handler(async ({ context, data }) => {
  const { id, ...values } = data;
  if (id) {
    const { data: current } = await context.supabase.from('events').select('status').eq('id', id).single();
    if (current?.status === 'cancelled' && values.status !== 'cancelled') throw new Error('A cancelled event cannot be reopened');
  }
  const query = id ? context.supabase.from('events').update({ ...values, updated_at: new Date().toISOString() }).eq('id',id) : context.supabase.from('events').insert(values);
  const { data: row, error } = await query.select('id').single();
  if (error) throw new Error('Could not save event. Check your organiser access.');
  return row;
});
export const ticketTypeSchema = z.object({
  id: z.string().uuid().optional(), event_id: z.string().uuid(), name: z.string().trim().min(2).max(100),
  price: z.number().min(1).max(1000000), quantity: z.number().int().min(1).max(1000000),
  sales_start: z.string().datetime().nullable(), sales_end: z.string().datetime().nullable(), sort_order: z.number().int().min(0).max(100),
}).refine(v => !v.sales_start || !v.sales_end || v.sales_end > v.sales_start, 'Sales end must be after sales start');
export const saveTicketType = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => ticketTypeSchema.parse(input)).handler(async ({ context, data }) => {
  const { id, ...values } = data;
  if (id) {
    const { data: existing } = await context.supabase.from('ticket_types').select('sold,event_id').eq('id',id).single();
    if (!existing) throw new Error('Ticket type not found');
    if (existing.event_id !== values.event_id) throw new Error('An existing ticket type cannot change events');
    if (values.quantity < existing.sold) throw new Error(`Capacity cannot be below ${existing.sold} tickets already sold`);
  }
  const query = id ? context.supabase.from('ticket_types').update(values).eq('id',id) : context.supabase.from('ticket_types').insert(values);
  const { error } = await query.select('id').single();
  if (error) throw new Error('Could not save ticket type');
  return { ok: true };
});
export const scanTicket = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ token: z.string().regex(/^[a-f0-9]{48}$/), eventId: z.string().uuid(), gate: z.string().trim().min(1).max(100), admit: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
  const { data: result, error } = await context.supabase.rpc('scan_ticket', { _token: data.token, _event_id: data.eventId, _gate: data.gate, _admit: data.admit });
  if (error) throw new Error('Could not verify ticket. Check your connection and organiser access.');
  return result as { result: string; reason?: string; ticket_code?: string; customer?: string; event?: string; ticket_type?: string; used_at?: string };
});
export const cancelTicket = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.from('tickets').update({ status: 'cancelled' }).eq('id',data.id).eq('status','valid').select('id').single();
  if (error) throw new Error('Only a valid, unused ticket can be cancelled.');
  return { ok: true };
});
export const saveOrganiser = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(150), email: z.string().email().max(255), phone: z.string().trim().max(30) }).parse(input)).handler(async ({ context, data }) => {
  const { id, ...values } = data;
  const { error } = await context.supabase.from('organisers').update(values).eq('id',id).select('id').single();
  if (error) throw new Error('Could not save organiser details');
  return { ok: true };
});
