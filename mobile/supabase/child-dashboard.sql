-- Run once in the Supabase SQL Editor. Existing Auth accounts are preserved.
begin;
create table if not exists public.qc_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
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
drop trigger if exists qc_create_profile on auth.users;
create trigger qc_create_profile after insert on auth.users for each row execute function public.qc_new_profile();
insert into public.qc_profiles(id,full_name,role)
select id,coalesce(nullif(raw_user_meta_data->>'full_name',''),'QuietCue user'),
case when raw_user_meta_data->>'role' in ('parent','child','family') then raw_user_meta_data->>'role' else 'child' end
from auth.users on conflict(id) do nothing;
alter table public.qc_profiles enable row level security;
alter table public.qc_family_links enable row level security;
alter table public.qc_requests enable row level security;
drop policy if exists qc_read_profiles on public.qc_profiles;
create policy qc_read_profiles on public.qc_profiles for select to authenticated using (
 id=auth.uid() or exists(select 1 from public.qc_family_links l where
 (l.child_id=auth.uid() and l.parent_id=id) or (l.parent_id=auth.uid() and l.child_id=id))
);
drop policy if exists qc_parent_status on public.qc_profiles;
create policy qc_parent_status on public.qc_profiles for update to authenticated
using(id=auth.uid() and role='parent') with check(id=auth.uid() and role='parent');
drop policy if exists qc_read_links on public.qc_family_links;
create policy qc_read_links on public.qc_family_links for select to authenticated using(child_id=auth.uid() or parent_id=auth.uid());
drop policy if exists qc_read_requests on public.qc_requests;
create policy qc_read_requests on public.qc_requests for select to authenticated using(child_id=auth.uid() or parent_id=auth.uid());
drop policy if exists qc_send_request on public.qc_requests;
create policy qc_send_request on public.qc_requests for insert to authenticated with check(
 child_id=auth.uid() and status='pending' and
 ((priority='emergency' and category='Emergency') or (priority='normal' and category<>'Emergency')) and
 exists(select 1 from public.qc_family_links l where l.child_id=auth.uid() and l.parent_id=qc_requests.parent_id)
);
drop policy if exists qc_answer_request on public.qc_requests;
create policy qc_answer_request on public.qc_requests for update to authenticated using(parent_id=auth.uid()) with check(parent_id=auth.uid());
revoke all on public.qc_profiles,public.qc_family_links,public.qc_requests from anon,authenticated;
grant select(id,full_name,role,focus_status,available_at) on public.qc_profiles to authenticated;
grant update(focus_status,available_at) on public.qc_profiles to authenticated;
grant select on public.qc_family_links,public.qc_requests to authenticated;
grant insert(child_id,parent_id,category,message,priority) on public.qc_requests to authenticated;
grant update(status) on public.qc_requests to authenticated;
create or replace function public.qc_my_invite() returns text
language plpgsql security definer set search_path='' as $$
declare result text;
begin
 select invite_code into result from public.qc_profiles where id=auth.uid() and role='parent';
 if result is null then raise exception 'Only a parent can get a family code.'; end if;
 return result;
end; $$;
create or replace function public.qc_join_parent(code text) returns void
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if not exists(select 1 from public.qc_profiles where id=auth.uid() and role in ('child','family')) then
 raise exception 'Please sign in with a child or family account.'; end if;
 select id into target from public.qc_profiles where invite_code=upper(trim(code)) and role='parent';
 if target is null then raise exception 'Family code not found. Ask your parent to check the code.'; end if;
 if exists(select 1 from public.qc_family_links where child_id=auth.uid()) then
 raise exception 'This account already has a connected parent.'; end if;
 insert into public.qc_family_links(child_id,parent_id) values(auth.uid(),target);
end; $$;
revoke all on function public.qc_new_profile() from public,anon,authenticated;
revoke all on function public.qc_my_invite(),public.qc_join_parent(text) from public,anon;
grant execute on function public.qc_my_invite(),public.qc_join_parent(text) to authenticated;
commit;
