begin;
do $$ begin
 if not exists(select 1 from pg_roles where rolname='qc_member') then
  create role qc_member nologin nosuperuser nobypassrls;
 end if;
 execute format('grant qc_member to %I',current_user);
end $$;
create schema if not exists qc_auth;
revoke all on schema qc_auth from public;
create table if not exists qc_auth.users (
 id uuid primary key default gen_random_uuid(),
 email text unique not null check(email=lower(trim(email))),
 password_hash text not null,
 raw_user_meta_data jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create table if not exists qc_auth.sessions (
 token_hash text primary key,
 user_id uuid not null references qc_auth.users(id) on delete cascade,
 expires_at timestamptz not null
);
create index if not exists qc_sessions_expiry on qc_auth.sessions(expires_at);
create or replace function public.qc_uid() returns uuid language sql stable
 set search_path='' as $$ select nullif(current_setting('quietcue.user_id',true),'')::uuid $$;
revoke all on function public.qc_uid() from public;
grant usage on schema public to qc_member;
grant execute on function public.qc_uid() to qc_member;
create table if not exists public.qc_profiles (
 id uuid primary key references qc_auth.users(id) on delete cascade,
 full_name text not null,
 role text not null check (role in ('parent','child','family')),
 invite_code text unique not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
 focus_status text not null default 'available' check (focus_status in ('available','focusing','break')),
 available_at timestamptz
);
create table if not exists public.qc_family_links (
 child_id uuid primary key references public.qc_profiles(id) on delete cascade,
 parent_id uuid not null references public.qc_profiles(id) on delete cascade,
 check (child_id <> parent_id)
);
create table if not exists public.qc_requests (
 id uuid primary key default gen_random_uuid(),
 child_id uuid not null references public.qc_profiles(id) on delete cascade,
 parent_id uuid not null references public.qc_profiles(id) on delete cascade,
 category text not null check (category in ('School help','Food & drink','Can we talk?','Something else','Emergency')),
 message text not null check (length(message) between 1 and 500),
 priority text not null default 'normal' check (priority in ('normal','emergency')),
 status text not null default 'pending' check (status in ('pending','acknowledged','done')),
 created_at timestamptz not null default now()
);
create index if not exists qc_requests_child_time on public.qc_requests(child_id,created_at desc);
create index if not exists qc_requests_parent_time on public.qc_requests(parent_id,created_at desc);
create index if not exists qc_links_parent on public.qc_family_links(parent_id);
create or replace function public.qc_new_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.qc_profiles(id,full_name,role)
 values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'QuietCue user'),
 case when new.raw_user_meta_data->>'role' in ('parent','child','family') then new.raw_user_meta_data->>'role' else 'child' end)
 on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists qc_create_profile on qc_auth.users;
create trigger qc_create_profile after insert on qc_auth.users for each row execute function public.qc_new_profile();
insert into public.qc_profiles(id,full_name,role)
select id,coalesce(nullif(raw_user_meta_data->>'full_name',''),'QuietCue user'),
case when raw_user_meta_data->>'role' in ('parent','child','family') then raw_user_meta_data->>'role' else 'child' end
from qc_auth.users on conflict(id) do nothing;
alter table public.qc_profiles enable row level security;
alter table public.qc_family_links enable row level security;
alter table public.qc_requests enable row level security;
drop policy if exists qc_read_profiles on public.qc_profiles;
create policy qc_read_profiles on public.qc_profiles for select to qc_member using (
 id=public.qc_uid() or exists(select 1 from public.qc_family_links l where
 (l.child_id=public.qc_uid() and l.parent_id=id) or (l.parent_id=public.qc_uid() and l.child_id=id))
);
drop policy if exists qc_parent_status on public.qc_profiles;
create policy qc_parent_status on public.qc_profiles for update to qc_member
using(id=public.qc_uid() and role='parent') with check(id=public.qc_uid() and role='parent');
drop policy if exists qc_read_links on public.qc_family_links;
create policy qc_read_links on public.qc_family_links for select to qc_member using(child_id=public.qc_uid() or parent_id=public.qc_uid());
drop policy if exists qc_read_requests on public.qc_requests;
create policy qc_read_requests on public.qc_requests for select to qc_member using(child_id=public.qc_uid() or parent_id=public.qc_uid());
drop policy if exists qc_send_request on public.qc_requests;
create policy qc_send_request on public.qc_requests for insert to qc_member with check(
 child_id=public.qc_uid() and status='pending' and
 ((priority='emergency' and category='Emergency') or (priority='normal' and category<>'Emergency')) and
 exists(select 1 from public.qc_family_links l where l.child_id=public.qc_uid() and l.parent_id=qc_requests.parent_id)
);
drop policy if exists qc_answer_request on public.qc_requests;
create policy qc_answer_request on public.qc_requests for update to qc_member using(parent_id=public.qc_uid()) with check(parent_id=public.qc_uid());
revoke all on public.qc_profiles,public.qc_family_links,public.qc_requests from qc_member;
grant select(id,full_name,role,focus_status,available_at) on public.qc_profiles to qc_member;
grant update(focus_status,available_at) on public.qc_profiles to qc_member;
grant select on public.qc_family_links,public.qc_requests to qc_member;
grant insert(child_id,parent_id,category,message,priority) on public.qc_requests to qc_member;
grant update(status) on public.qc_requests to qc_member;
create or replace function public.qc_my_invite() returns text
language plpgsql security definer set search_path='' as $$
declare result text;
begin
 select invite_code into result from public.qc_profiles where id=public.qc_uid() and role='parent';
 if result is null then raise exception 'Only a parent can get a family code.'; end if;
 return result;
end; $$;
create or replace function public.qc_join_parent(code text) returns void
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if not exists(select 1 from public.qc_profiles where id=public.qc_uid() and role in ('child','family')) then
 raise exception 'Please sign in with a child or family account.'; end if;
 select id into target from public.qc_profiles where invite_code=upper(trim(code)) and role='parent';
 if target is null then raise exception 'Family code not found. Ask your parent to check the code.'; end if;
 if exists(select 1 from public.qc_family_links where child_id=public.qc_uid()) then
 raise exception 'This account already has a connected parent.'; end if;
 insert into public.qc_family_links(child_id,parent_id) values(public.qc_uid(),target);
end; $$;
revoke all on function public.qc_new_profile() from public,qc_member;
revoke all on function public.qc_my_invite(),public.qc_join_parent(text) from public;
grant execute on function public.qc_my_invite(),public.qc_join_parent(text) to qc_member;

create table if not exists public.qc_tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.qc_profiles(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 120),
 completed boolean not null default false,
 completed_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.qc_tasks add column if not exists completed_at timestamptz;
create or replace function public.qc_task_completion() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.completed and not old.completed then new.completed_at:=now();
 elsif not new.completed then new.completed_at:=null;
 else new.completed_at:=old.completed_at;
 end if;
 return new;
end; $$;
drop trigger if exists qc_set_task_completion on public.qc_tasks;
create trigger qc_set_task_completion before update on public.qc_tasks for each row execute function public.qc_task_completion();
revoke all on function public.qc_task_completion() from public,qc_member;
create table if not exists public.qc_focus_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.qc_profiles(id) on delete cascade,
 task_id uuid references public.qc_tasks(id) on delete set null,
 started_at timestamptz not null default now(),
 planned_end timestamptz not null,
 ended_at timestamptz,
 check(planned_end>started_at),
 check(ended_at is null or (ended_at>=started_at and ended_at<=planned_end))
);
create table if not exists public.qc_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.qc_profiles(id) on delete cascade,
 kind text not null check(kind in ('child_connected','request','emergency')),
 title text not null,
 body text not null,
 event_key text not null,
 request_id uuid references public.qc_requests(id) on delete set null,
 read_at timestamptz,
 created_at timestamptz not null default now(),
 unique(recipient_id,event_key)
);
create index if not exists qc_tasks_owner on public.qc_tasks(user_id,created_at desc);
create index if not exists qc_focus_owner on public.qc_focus_sessions(user_id,started_at desc);
create index if not exists qc_notifications_recipient on public.qc_notifications(recipient_id,created_at desc);
alter table public.qc_tasks enable row level security;
alter table public.qc_focus_sessions enable row level security;
alter table public.qc_notifications enable row level security;
drop policy if exists qc_own_tasks on public.qc_tasks;
create policy qc_own_tasks on public.qc_tasks for all to qc_member
 using(user_id=public.qc_uid()) with check(user_id=public.qc_uid() and exists(select 1 from public.qc_profiles where id=public.qc_uid() and role='parent'));
drop policy if exists qc_own_focus on public.qc_focus_sessions;
create policy qc_own_focus on public.qc_focus_sessions for select to qc_member using(user_id=public.qc_uid());
drop policy if exists qc_own_notifications on public.qc_notifications;
create policy qc_own_notifications on public.qc_notifications for select to qc_member using(recipient_id=public.qc_uid());
drop policy if exists qc_read_notification on public.qc_notifications;
create policy qc_read_notification on public.qc_notifications for update to qc_member using(recipient_id=public.qc_uid()) with check(recipient_id=public.qc_uid());
revoke all on public.qc_tasks,public.qc_focus_sessions,public.qc_notifications from qc_member;
grant select,delete on public.qc_tasks to qc_member;
grant insert(user_id,title),update(title,completed) on public.qc_tasks to qc_member;
grant select on public.qc_focus_sessions,public.qc_notifications to qc_member;
grant update(read_at) on public.qc_notifications to qc_member;

create or replace function public.qc_notify_family() returns trigger
language plpgsql security definer set search_path='' as $$
declare child_name text;
begin
 select full_name into child_name from public.qc_profiles where id=new.child_id;
 if tg_table_name='qc_family_links' then
  insert into public.qc_notifications(recipient_id,kind,title,body,event_key)
  values(new.parent_id,'child_connected','Your family just grew',coalesce(child_name,'Your child')||' connected using your family code.','link:'||new.child_id::text)
  on conflict(recipient_id,event_key) do nothing;
 else
  insert into public.qc_notifications(recipient_id,kind,title,body,event_key,request_id)
  values(new.parent_id,case when new.priority='emergency' then 'emergency' else 'request' end,
   case when new.priority='emergency' then 'Emergency request' else 'New family request' end,
   coalesce(child_name,'Your child')||': '||new.message,'request:'||new.id::text,new.id)
  on conflict(recipient_id,event_key) do nothing;
 end if;
 return new;
end; $$;
drop trigger if exists qc_notify_connection on public.qc_family_links;
create trigger qc_notify_connection after insert on public.qc_family_links for each row execute function public.qc_notify_family();
drop trigger if exists qc_notify_request on public.qc_requests;
create trigger qc_notify_request after insert on public.qc_requests for each row execute function public.qc_notify_family();
-- Existing linked children and pending requests appear in the parent's inbox too.
insert into public.qc_notifications(recipient_id,kind,title,body,event_key)
select l.parent_id,'child_connected','Your family connection',p.full_name||' is connected to your family.','link:'||l.child_id::text
from public.qc_family_links l join public.qc_profiles p on p.id=l.child_id on conflict(recipient_id,event_key) do nothing;
insert into public.qc_notifications(recipient_id,kind,title,body,event_key,request_id,created_at)
select r.parent_id,case when r.priority='emergency' then 'emergency' else 'request' end,
case when r.priority='emergency' then 'Emergency request' else 'New family request' end,
p.full_name||': '||r.message,'request:'||r.id::text,r.id,r.created_at
from public.qc_requests r join public.qc_profiles p on p.id=r.child_id where r.status<>'done'
on conflict(recipient_id,event_key) do nothing;

create or replace function public.qc_start_focus(minutes integer,selected_task uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; focus_now timestamptz:=now();
begin
 if not exists(select 1 from public.qc_profiles where id=public.qc_uid() and role='parent') then raise exception 'Parent account required.'; end if;
 -- Serializes multiple taps/devices for the same parent.
 perform 1 from public.qc_profiles where id=public.qc_uid() for update;
 if minutes is null or minutes not in (15,25,50) then raise exception 'Choose a 15, 25 or 50 minute session.'; end if;
 if selected_task is not null and not exists(select 1 from public.qc_tasks where id=selected_task and user_id=public.qc_uid() and not completed) then raise exception 'Choose one of your unfinished tasks.'; end if;
 update public.qc_focus_sessions set ended_at=least(focus_now,planned_end) where user_id=public.qc_uid() and ended_at is null;
 insert into public.qc_focus_sessions(user_id,task_id,started_at,planned_end)
 values(public.qc_uid(),selected_task,focus_now,focus_now+make_interval(mins=>minutes)) returning id into result;
 update public.qc_profiles set focus_status='focusing',available_at=focus_now+make_interval(mins=>minutes) where id=public.qc_uid();
 return result;
end; $$;
create or replace function public.qc_end_focus(next_status text default 'available') returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.qc_profiles where id=public.qc_uid() and role='parent') then raise exception 'Parent account required.'; end if;
 if next_status is null or next_status not in ('available','break') then raise exception 'Invalid status.'; end if;
 perform 1 from public.qc_profiles where id=public.qc_uid() for update;
 update public.qc_focus_sessions set ended_at=least(now(),planned_end) where user_id=public.qc_uid() and ended_at is null;
 update public.qc_profiles set focus_status=next_status,available_at=null where id=public.qc_uid();
end; $$;
revoke all on function public.qc_notify_family(),public.qc_start_focus(integer,uuid),public.qc_end_focus(text) from public,qc_member;
grant execute on function public.qc_start_focus(integer,uuid),public.qc_end_focus(text) to qc_member;

commit;
