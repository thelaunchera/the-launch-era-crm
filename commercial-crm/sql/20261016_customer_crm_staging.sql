-- Buyer-only CRM staging. No TLE owner tables, data, automations or agent references.
-- Execute in the separate Supabase TESTING project, never on the live project without release approval.
create extension if not exists btree_gist with schema extensions;

create table if not exists public.customer_crm_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  name text not null check (char_length(name) between 2 and 120),
  timezone text not null default 'America/New_York',
  quarterly_quota_cents bigint check (quarterly_quota_cents is null or quarterly_quota_cents >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.customer_crm_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.customer_crm_workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  company text not null default '',
  email text,
  phone text,
  source text,
  status text not null default 'New' check(status in ('New','Contacted','Qualified','Won')),
  score int check(score between 0 and 100),
  created_at timestamptz not null default now()
);
create table if not exists public.customer_crm_deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.customer_crm_workspaces(id) on delete cascade,
  contact_id uuid references public.customer_crm_contacts(id) on delete set null,
  title text not null check(char_length(title) between 1 and 180),
  amount_cents bigint not null check(amount_cents >= 0),
  stage text not null default 'Qualified' check(stage in ('Qualified','Proposal','Negotiation','Won')),
  close_at date,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create table if not exists public.customer_crm_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.customer_crm_workspaces(id) on delete cascade,
  contact_id uuid not null references public.customer_crm_contacts(id) on delete cascade,
  kind text not null default 'note' check(kind in ('note','call','meeting','email')),
  body text not null check(char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);
create table if not exists public.customer_crm_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.customer_crm_workspaces(id) on delete cascade,
  contact_id uuid references public.customer_crm_contacts(id) on delete set null,
  title text not null check(char_length(title) between 1 and 220),
  due_on date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.customer_crm_bookings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.customer_crm_workspaces(id) on delete cascade,
  contact_id uuid references public.customer_crm_contacts(id) on delete set null,
  title text not null check(char_length(title) between 1 and 180),
  service_type text not null default 'Appointment',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'requested' check(status in ('requested','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  constraint customer_crm_booking_dates_valid check(ends_at > starts_at),
  constraint customer_crm_booking_no_overlap exclude using gist (
    workspace_id with =,
    tstzrange(starts_at,ends_at,'[)') with &&
  ) where (status = 'confirmed')
);
create table if not exists public.customer_crm_sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.customer_crm_workspaces(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 180),
  status text not null default 'draft' check(status = 'draft'),
  created_at timestamptz not null default now()
);
create table if not exists public.customer_crm_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.customer_crm_workspaces(id) on delete cascade,
  sequence_id uuid not null references public.customer_crm_sequences(id) on delete cascade,
  step_order integer not null check(step_order >= 0),
  step_type text not null check(step_type in ('email','wait')),
  subject text,
  body text,
  wait_days integer check(wait_days between 1 and 14),
  unique(sequence_id,step_order)
);
-- Prevent cross-workspace references. An ID from workspace B cannot be attached to workspace A.
alter table public.customer_crm_contacts add constraint customer_crm_contacts_workspace_id_id unique (workspace_id,id);
alter table public.customer_crm_sequences add constraint customer_crm_sequences_workspace_id_id unique (workspace_id,id);
alter table public.customer_crm_deals add constraint customer_crm_deals_contact_scope foreign key (workspace_id,contact_id) references public.customer_crm_contacts(workspace_id,id);
alter table public.customer_crm_activities add constraint customer_crm_activities_contact_scope foreign key (workspace_id,contact_id) references public.customer_crm_contacts(workspace_id,id);
alter table public.customer_crm_tasks add constraint customer_crm_tasks_contact_scope foreign key (workspace_id,contact_id) references public.customer_crm_contacts(workspace_id,id);
alter table public.customer_crm_bookings add constraint customer_crm_bookings_contact_scope foreign key (workspace_id,contact_id) references public.customer_crm_contacts(workspace_id,id);
alter table public.customer_crm_sequence_steps add constraint customer_crm_steps_sequence_scope foreign key (workspace_id,sequence_id) references public.customer_crm_sequences(workspace_id,id);
create index if not exists customer_crm_contacts_workspace_idx on public.customer_crm_contacts(workspace_id,created_at desc);
create index if not exists customer_crm_deals_workspace_idx on public.customer_crm_deals(workspace_id,created_at desc);
create index if not exists customer_crm_tasks_workspace_idx on public.customer_crm_tasks(workspace_id,due_on);
create index if not exists customer_crm_activities_workspace_idx on public.customer_crm_activities(workspace_id,created_at desc);
create index if not exists customer_crm_bookings_workspace_idx on public.customer_crm_bookings(workspace_id,starts_at);
create index if not exists customer_crm_steps_workspace_idx on public.customer_crm_sequence_steps(workspace_id,sequence_id,step_order);

alter table public.customer_crm_workspaces enable row level security;
create policy buyer_workspace_read on public.customer_crm_workspaces for select to authenticated
  using(owner_user_id = (select auth.uid()));
create policy buyer_workspace_create on public.customer_crm_workspaces for insert to authenticated
  with check(owner_user_id = (select auth.uid()));
create policy buyer_workspace_update on public.customer_crm_workspaces for update to authenticated
  using(owner_user_id = (select auth.uid())) with check(owner_user_id = (select auth.uid()));
revoke all on public.customer_crm_workspaces from anon, authenticated;
grant select,insert,update on public.customer_crm_workspaces to authenticated;

alter table public.customer_crm_contacts enable row level security;
create policy buyer_contacts_read on public.customer_crm_contacts for select to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_contacts_create on public.customer_crm_contacts for insert to authenticated
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_contacts_update on public.customer_crm_contacts for update to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_contacts_delete on public.customer_crm_contacts for delete to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
revoke all on public.customer_crm_contacts from anon, authenticated;
grant select,insert,update,delete on public.customer_crm_contacts to authenticated;

alter table public.customer_crm_deals enable row level security;
create policy buyer_deals_read on public.customer_crm_deals for select to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_deals_create on public.customer_crm_deals for insert to authenticated
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_deals_update on public.customer_crm_deals for update to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_deals_delete on public.customer_crm_deals for delete to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
revoke all on public.customer_crm_deals from anon, authenticated;
grant select,insert,update,delete on public.customer_crm_deals to authenticated;

alter table public.customer_crm_activities enable row level security;
create policy buyer_activities_read on public.customer_crm_activities for select to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_activities_create on public.customer_crm_activities for insert to authenticated
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_activities_update on public.customer_crm_activities for update to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_activities_delete on public.customer_crm_activities for delete to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
revoke all on public.customer_crm_activities from anon, authenticated;
grant select,insert,update,delete on public.customer_crm_activities to authenticated;

alter table public.customer_crm_tasks enable row level security;
create policy buyer_tasks_read on public.customer_crm_tasks for select to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_tasks_create on public.customer_crm_tasks for insert to authenticated
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_tasks_update on public.customer_crm_tasks for update to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_tasks_delete on public.customer_crm_tasks for delete to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
revoke all on public.customer_crm_tasks from anon, authenticated;
grant select,insert,update,delete on public.customer_crm_tasks to authenticated;

alter table public.customer_crm_bookings enable row level security;
create policy buyer_bookings_read on public.customer_crm_bookings for select to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_bookings_create on public.customer_crm_bookings for insert to authenticated
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_bookings_update on public.customer_crm_bookings for update to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_bookings_delete on public.customer_crm_bookings for delete to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
revoke all on public.customer_crm_bookings from anon, authenticated;
grant select,insert,update,delete on public.customer_crm_bookings to authenticated;

alter table public.customer_crm_sequences enable row level security;
create policy buyer_sequences_read on public.customer_crm_sequences for select to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_sequences_create on public.customer_crm_sequences for insert to authenticated
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_sequences_update on public.customer_crm_sequences for update to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_sequences_delete on public.customer_crm_sequences for delete to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
revoke all on public.customer_crm_sequences from anon, authenticated;
grant select,insert,update,delete on public.customer_crm_sequences to authenticated;

alter table public.customer_crm_sequence_steps enable row level security;
create policy buyer_sequence_steps_read on public.customer_crm_sequence_steps for select to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_sequence_steps_create on public.customer_crm_sequence_steps for insert to authenticated
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_sequence_steps_update on public.customer_crm_sequence_steps for update to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())))
 with check (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
create policy buyer_sequence_steps_delete on public.customer_crm_sequence_steps for delete to authenticated
 using (exists (select 1 from public.customer_crm_workspaces w where w.id = workspace_id and w.owner_user_id = (select auth.uid())));
revoke all on public.customer_crm_sequence_steps from anon, authenticated;
grant select,insert,update,delete on public.customer_crm_sequence_steps to authenticated;
