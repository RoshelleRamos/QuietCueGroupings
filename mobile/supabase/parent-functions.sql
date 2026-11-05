-- Run AFTER child-dashboard.sql. Keeps existing accounts, family codes and links.
begin;
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
revoke all on function public.qc_task_completion() from public,anon,authenticated;
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
create policy qc_own_tasks on public.qc_tasks for all to authenticated
 using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.qc_profiles where id=auth.uid() and role='parent'));
drop policy if exists qc_own_focus on public.qc_focus_sessions;
create policy qc_own_focus on public.qc_focus_sessions for select to authenticated using(user_id=auth.uid());
drop policy if exists qc_own_notifications on public.qc_notifications;
create policy qc_own_notifications on public.qc_notifications for select to authenticated using(recipient_id=auth.uid());
drop policy if exists qc_read_notification on public.qc_notifications;
create policy qc_read_notification on public.qc_notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
revoke all on public.qc_tasks,public.qc_focus_sessions,public.qc_notifications from anon,authenticated;
grant select,delete on public.qc_tasks to authenticated;
grant insert(user_id,title),update(title,completed) on public.qc_tasks to authenticated;
grant select on public.qc_focus_sessions,public.qc_notifications to authenticated;
grant update(read_at) on public.qc_notifications to authenticated;

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
 if not exists(select 1 from public.qc_profiles where id=auth.uid() and role='parent') then raise exception 'Parent account required.'; end if;
 -- Serializes multiple taps/devices for the same parent.
 perform 1 from public.qc_profiles where id=auth.uid() for update;
 if minutes not in (15,25,50) then raise exception 'Choose a 15, 25 or 50 minute session.'; end if;
 if selected_task is not null and not exists(select 1 from public.qc_tasks where id=selected_task and user_id=auth.uid() and not completed) then raise exception 'Choose one of your unfinished tasks.'; end if;
 update public.qc_focus_sessions set ended_at=least(focus_now,planned_end) where user_id=auth.uid() and ended_at is null;
 insert into public.qc_focus_sessions(user_id,task_id,started_at,planned_end)
 values(auth.uid(),selected_task,focus_now,focus_now+make_interval(mins=>minutes)) returning id into result;
 update public.qc_profiles set focus_status='focusing',available_at=focus_now+make_interval(mins=>minutes) where id=auth.uid();
 return result;
end; $$;
create or replace function public.qc_end_focus(next_status text default 'available') returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.qc_profiles where id=auth.uid() and role='parent') then raise exception 'Parent account required.'; end if;
 if next_status not in ('available','break') then raise exception 'Invalid status.'; end if;
 perform 1 from public.qc_profiles where id=auth.uid() for update;
 update public.qc_focus_sessions set ended_at=least(now(),planned_end) where user_id=auth.uid() and ended_at is null;
 update public.qc_profiles set focus_status=next_status,available_at=null where id=auth.uid();
end; $$;
revoke all on function public.qc_notify_family(),public.qc_start_focus(integer,uuid),public.qc_end_focus(text) from public,anon,authenticated;
grant execute on function public.qc_start_focus(integer,uuid),public.qc_end_focus(text) to authenticated;
-- Enable live changes. The app also polls while active if realtime is unavailable.
do $$ declare table_name text; begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach table_name in array array['qc_notifications','qc_family_links','qc_requests','qc_tasks','qc_focus_sessions'] loop
   if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
    execute format('alter publication supabase_realtime add table public.%I',table_name);
   end if;
  end loop;
 end if;
end; $$;
commit;
