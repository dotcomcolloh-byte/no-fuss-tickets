create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin','staff');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','staff'))
$$;

create table public.organisers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create type public.event_status as enum ('draft','published','unpublished','cancelled');
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid references public.organisers(id) on delete set null,
  name text not null,
  event_type text not null,
  description text,
  cover_image_url text,
  event_date date not null,
  start_time time,
  end_time time,
  venue text not null,
  location text not null,
  status public.event_status not null default 'draft',
  featured boolean not null default false,
  require_id boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  quantity integer not null check (quantity >= 0),
  sold integer not null default 0 check (sold >= 0),
  sales_start timestamptz,
  sales_end timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint sold_not_over check (sold <= quantity)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  national_id text,
  created_at timestamptz not null default now()
);

create type public.pay_status as enum ('pending','processing','paid','failed','cancelled','refunded');
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique default ('ORD-' || upper(encode(extensions.gen_random_bytes(5),'hex'))),
  customer_id uuid not null references public.customers(id),
  event_id uuid not null references public.events(id),
  subtotal numeric(12,2) not null,
  fees numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null default 'KES',
  status public.pay_status not null default 'pending',
  idempotency_key text unique,
  access_token text not null unique default encode(extensions.gen_random_bytes(24),'hex'),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  transaction_ref text not null unique default ('TK-' || to_char(now(),'YYYYMMDD') || '-' || upper(encode(extensions.gen_random_bytes(3),'hex'))),
  provider text not null,
  method text not null,
  provider_reference text,
  amount numeric(12,2) not null,
  currency text not null default 'KES',
  status public.pay_status not null default 'pending',
  verification_status text not null default 'unverified',
  provider_payload jsonb,
  paid_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.ticket_status as enum ('valid','used','cancelled','refunded');
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  event_id uuid not null references public.events(id),
  ticket_type_id uuid not null references public.ticket_types(id),
  customer_id uuid not null references public.customers(id),
  ticket_code text not null unique,
  token text not null unique,
  status public.ticket_status not null default 'valid',
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ticket_scans (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  scanned_by uuid,
  gate text,
  result text not null,
  scanned_at timestamptz not null default now()
);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  to_email text not null,
  subject text not null,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

grant select on public.events, public.ticket_types to anon;
grant select, insert, update, delete on public.organisers, public.events, public.ticket_types, public.customers, public.orders, public.order_items, public.payments, public.tickets, public.ticket_scans, public.email_logs to authenticated;
grant all on public.organisers, public.events, public.ticket_types, public.customers, public.orders, public.order_items, public.payments, public.tickets, public.ticket_scans, public.email_logs, public.webhook_events to service_role;

alter table public.organisers enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_scans enable row level security;
alter table public.email_logs enable row level security;
alter table public.webhook_events enable row level security;

create policy "public read published events" on public.events for select to anon, authenticated using (status = 'published');
create policy "public read ticket types" on public.ticket_types for select to anon, authenticated using (exists (select 1 from public.events e where e.id = event_id and e.status = 'published'));

create policy "staff all" on public.organisers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.events for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.ticket_types for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.customers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.orders for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.order_items for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.payments for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.tickets for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.ticket_scans for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff all" on public.email_logs for all to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function public.fulfill_order(_payment_id uuid, _provider_reference text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare p public.payments; o public.orders; it record; i int;
begin
  select * into p from public.payments where id = _payment_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  select * into o from public.orders where id = p.order_id for update;
  if o.status = 'paid' then return jsonb_build_object('status','already_paid','order_id',o.id); end if;
  if o.status in ('cancelled','refunded') then return jsonb_build_object('status','not_payable'); end if;
  for it in select * from public.order_items where order_id = o.id loop
    update public.ticket_types set sold = sold + it.quantity
      where id = it.ticket_type_id and sold + it.quantity <= quantity;
    if not found then raise exception 'SOLD_OUT'; end if;
    for i in 1..it.quantity loop
      insert into public.tickets(order_id, order_item_id, event_id, ticket_type_id, customer_id, ticket_code, token)
      values (o.id, it.id, o.event_id, it.ticket_type_id, o.customer_id,
        'TK-' || upper(encode(gen_random_bytes(5),'hex')), encode(gen_random_bytes(24),'hex'));
    end loop;
  end loop;
  update public.payments set status='paid', verification_status='verified',
    provider_reference = coalesce(_provider_reference, provider_reference),
    paid_at = now(), verified_at = now(), updated_at = now() where id = p.id;
  update public.orders set status='paid', paid_at = now() where id = o.id;
  return jsonb_build_object('status','paid','order_id',o.id);
end $$;
revoke execute on function public.fulfill_order(uuid, text) from public, anon, authenticated;
grant execute on function public.fulfill_order(uuid, text) to service_role;

create or replace function public.scan_ticket(_token text, _event_id uuid, _gate text, _admit boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.tickets; o public.orders; c public.customers; e public.events; tt public.ticket_types; res text;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
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
revoke execute on function public.scan_ticket(text, uuid, text, boolean) from public, anon;
grant execute on function public.scan_ticket(text, uuid, text, boolean) to authenticated;

insert into public.organisers (id, name, email, phone) values
 ('00000000-0000-0000-0000-000000000001','Tumdo Kalenjin Connect','collinsrono359@gmail.com','+254 700 000 000');

insert into public.events (id, organiser_id, name, event_type, description, cover_image_url, event_date, start_time, end_time, venue, location, status, featured) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Koffi Olomide Live','Music','The King of Congolese rumba is back! An unforgettable night of rumba, soukous and legendary hits live in Nairobi.','/__l5e/assets-v1/c935bf94-146c-4203-9217-881e8b6d96b5/koffi.jpg', current_date + 30, '19:00','23:59','Nairobi Stadium','Nairobi','published', true),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','The Unity Festival','Festivals','A full day of music, food and culture celebrating unity across Kenya.','/__l5e/assets-v1/9a7fd042-4a93-4b60-af59-4bda0da28ec3/festival.jpg', current_date + 30, '12:00','23:00','KICC Grounds','Nairobi','published', false),
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Kalenjin Cultural Day','Cultural','Traditional dance, song, food and storytelling from the Kalenjin community.','/__l5e/assets-v1/f9e29311-d4c3-4183-ba65-3a0cefc49ded/cultural.jpg', current_date + 45, '10:00','18:00','Kipchoge Keino Stadium','Eldoret','published', false),
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','Laugh Out Loud Nairobi','Comedy','Kenya''s funniest comedians on one stage for a night of non-stop laughter.','/__l5e/assets-v1/658f18c7-8c4d-421c-82d4-f5e432f260ea/comedy.jpg', current_date + 20, '20:00','23:00','Carnivore Grounds','Nairobi','published', false);

insert into public.ticket_types (event_id, name, price, quantity, sort_order) values
 ('10000000-0000-0000-0000-000000000001','General Admission',2000,500,1),
 ('10000000-0000-0000-0000-000000000001','VIP',5000,300,2),
 ('10000000-0000-0000-0000-000000000001','VVIP',10000,100,3),
 ('10000000-0000-0000-0000-000000000002','General Admission',2000,1000,1),
 ('10000000-0000-0000-0000-000000000002','VIP',4000,200,2),
 ('10000000-0000-0000-0000-000000000003','General Admission',500,800,1),
 ('10000000-0000-0000-0000-000000000003','VIP',1500,150,2),
 ('10000000-0000-0000-0000-000000000004','General Admission',1500,300,1),
 ('10000000-0000-0000-0000-000000000004','VIP',3500,80,2);

do $$
declare cid uuid; oid uuid; pid uuid; tt uuid; r record;
begin
  for r in select * from (values
    ('John Kamau','john@example.com','+254712345678','10000000-0000-0000-0000-000000000001'::uuid,'VIP',2,'mpesa'),
    ('Amina Wanjiku','aminah@example.com','+254722111222','10000000-0000-0000-0000-000000000002'::uuid,'General Admission',2,'card'),
    ('David Ochieng','david@example.com','+254733444555','10000000-0000-0000-0000-000000000001'::uuid,'VVIP',1,'mpesa')
  ) as v(n,em,ph,ev,tname,q,m) loop
    insert into public.customers(full_name,email,phone) values (r.n,r.em,r.ph) returning id into cid;
    select id into tt from public.ticket_types where event_id = r.ev and name = r.tname;
    insert into public.orders(customer_id,event_id,subtotal,fees,total)
      select cid, r.ev, price*r.q, 0, price*r.q from public.ticket_types where id = tt returning id into oid;
    insert into public.order_items(order_id,ticket_type_id,quantity,unit_price) select oid, tt, r.q, price from public.ticket_types where id = tt;
    insert into public.payments(order_id,provider,method,amount,status,provider_payload)
      select oid,'sandbox',r.m,total,'processing','{"seed":true}'::jsonb from public.orders where id = oid returning id into pid;
    perform public.fulfill_order(pid, 'SBX-SEED-' || substr(pid::text,1,8));
  end loop;
end $$;