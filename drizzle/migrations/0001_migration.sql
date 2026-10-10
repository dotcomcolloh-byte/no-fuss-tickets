create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
grant all on public.rate_limits to service_role;
alter table public.rate_limits enable row level security;

create or replace function public.hit_rate_limit(_key text, _limit int, _window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.rate_limits;
begin
  insert into public.rate_limits(key, window_start, hits) values (_key, now(), 1)
  on conflict (key) do update set
    hits = case when public.rate_limits.window_start < now() - make_interval(secs => _window_seconds) then 1 else public.rate_limits.hits + 1 end,
    window_start = case when public.rate_limits.window_start < now() - make_interval(secs => _window_seconds) then now() else public.rate_limits.window_start end
  returning * into r;
  if random() < 0.01 then delete from public.rate_limits where window_start < now() - interval '1 day'; end if;
  return r.hits <= _limit;
end $$;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

create or replace function public.scan_ticket(_token text, _event_id uuid, _gate text, _admit boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.tickets; o public.orders; c public.customers; e public.events; tt public.ticket_types; res text;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if not public.hit_rate_limit('scan:' || auth.uid()::text, 60, 60) then
    return jsonb_build_object('result','rate_limited','reason','Too many scans, wait a moment');
  end if;
  select * into t from public.tickets where token = _token for update;
  if not found then
    insert into public.ticket_scans(event_id, scanned_by, gate, result) values (_event_id, auth.uid(), _gate, 'invalid');
    return jsonb_build_object('result','invalid','reason','Ticket not found');
  end if;
  select * into o from public.orders where id = t.order_id;
  select * into c from public.customers where id = t.customer_id;
  select * into e from public.events where id = t.event_id;
  select * into tt from public.ticket_types where id = t.ticket_type_id;
  if _event_id is not null and t.event_id <> _event_id then res := 'wrong_event';
  elsif o.status <> 'paid' then res := 'invalid';
  elsif t.status in ('cancelled','refunded') then res := 'invalid';
  elsif t.status = 'used' then res := 'used';
  else res := 'valid'; end if;
  if res = 'valid' and _admit then
    update public.tickets set status='used', used_at = now() where id = t.id;
    res := 'admitted';
  end if;
  if _admit or res <> 'valid' then
    insert into public.ticket_scans(ticket_id, event_id, scanned_by, gate, result) values (t.id, t.event_id, auth.uid(), _gate, res);
  end if;
  return jsonb_build_object('result', res, 'ticket_code', t.ticket_code, 'customer', c.full_name,
    'event', e.name, 'event_date', e.event_date, 'venue', e.venue, 'ticket_type', tt.name, 'used_at', t.used_at, 'status', t.status);
end $$;