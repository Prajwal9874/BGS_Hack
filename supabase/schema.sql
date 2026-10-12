-- Run once in a NEW Supabase project's SQL editor. No service key is needed.
-- MVP: one active partner per user, daily accountability evaluated on account refresh.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 60),
 known text[] not null check(cardinality(known) between 1 and 13),
 target text not null,
 level text not null check(level in ('Beginner','Intermediate','Advanced')),
 slot text not null check(slot in ('Morning','Afternoon','Evening')),
 goal int not null check(goal in (10,15,20,30)),
 bio text not null default '' check(length(bio)<=300),
 streak int not null default 0 check(streak>=0),
 completed int not null default 0 check(completed>=0),
 misses int not null default 0 check(misses>=0),
 cooldown_until timestamptz,
 partner_id uuid references public.profiles(id) on delete set null,
 last_checkin date,
 last_evaluated date not null default (now() at time zone 'Asia/Kolkata')::date,
 created_at timestamptz not null default now(),
 check(not(target=any(known))), check(partner_id is null or partner_id<>id)
);
create table public.learning_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb check(jsonb_typeof(data)='object' and octet_length(data::text)<500000)
);
create table public.peer_messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 content text not null check(length(trim(content)) between 1 and 1500),
 created_at timestamptz not null default now(), check(sender_id<>recipient_id)
);
create index peer_messages_recipient on public.peer_messages(recipient_id,created_at);
create index peer_messages_sender on public.peer_messages(sender_id,created_at);
create table private.tutor_requests (user_id uuid not null references auth.users(id) on delete cascade, requested_at timestamptz not null default now());
create index tutor_requests_user_time on private.tutor_requests(user_id,requested_at);

alter table public.profiles enable row level security;
alter table public.learning_state enable row level security;
alter table public.peer_messages enable row level security;
alter table private.tutor_requests enable row level security;
revoke all on public.profiles, public.learning_state, public.peer_messages from anon, authenticated;
grant select on public.profiles to authenticated;
grant select,insert,update,delete on public.learning_state to authenticated;
grant select,insert on public.peer_messages to authenticated;
create policy directory_read on public.profiles for select to authenticated using (true);
create policy own_learning_read on public.learning_state for select to authenticated using ((select auth.uid())=user_id);
create policy own_learning_insert on public.learning_state for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_learning_update on public.learning_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_learning_delete on public.learning_state for delete to authenticated using ((select auth.uid())=user_id);
create policy pair_messages_read on public.peer_messages for select to authenticated using (
 ((select auth.uid())=sender_id or (select auth.uid())=recipient_id)
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.partner_id=case when sender_id=(select auth.uid()) then recipient_id else sender_id end)
);
create policy pair_messages_write on public.peer_messages for insert to authenticated with check (
 (select auth.uid())=sender_id and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.partner_id=recipient_id)
);

-- Privileged functions live in a non-exposed schema. All authenticate internally;
-- public RPC wrappers are SECURITY INVOKER. A small global lock makes pairing atomic.
create function private.refresh_accountability() returns void language plpgsql security definer set search_path='' as $$
declare p public.profiles; today date=(now() at time zone 'Asia/Kolkata')::date; lost int;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(810101);
 select * into p from public.profiles where id=auth.uid() for update;
 if p.id is null or p.last_evaluated>=today then return; end if;
 lost=greatest(0,today-p.last_evaluated-case when p.last_checkin=p.last_evaluated then 1 else 0 end);
 if lost>0 then
   if p.misses+lost>=3 and p.partner_id is not null then update public.profiles set partner_id=null where id=p.partner_id and partner_id=p.id; end if;
   update public.profiles set misses=misses+lost,streak=0,cooldown_until=case when misses+lost>=2 then now()+interval '24 hours' else null end,partner_id=case when misses+lost>=3 then null else partner_id end where id=p.id;
 end if;
 update public.profiles set last_evaluated=today where id=p.id;
end $$;
create function private.release_partner() returns void language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(810101);
 select partner_id into pid from public.profiles where id=auth.uid() for update;
 update public.profiles set partner_id=null where id=pid and partner_id=auth.uid();
 update public.profiles set partner_id=null where id=auth.uid();
end $$;
create function private.save_profile(p_name text,p_known text[],p_target text,p_level text,p_slot text,p_goal int,p_bio text) returns void language plpgsql security definer set search_path='' as $$
declare allowed text[]=array['Kannada','Hindi','Japanese','German','French','Italian','Korean','Tamil','Telugu','Marathi','Bengali','Malayalam','English']; old public.profiles;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if p_name is null or length(trim(p_name)) not between 1 and 60 or p_known is null or cardinality(p_known) not between 1 and 13 or not(p_known<@allowed) or p_target is null or not(p_target=any(allowed)) or p_target=any(p_known) or p_bio is null or length(p_bio)>300 then raise exception 'Invalid learning profile'; end if;
 perform pg_advisory_xact_lock(810101);
 select * into old from public.profiles where id=auth.uid() for update;
 if old.id is not null and (old.known<>p_known or old.target<>p_target) then perform private.release_partner(); end if;
 insert into public.profiles(id,name,known,target,level,slot,goal,bio) values(auth.uid(),trim(p_name),p_known,p_target,p_level,p_slot,p_goal,p_bio)
 on conflict(id) do update set name=excluded.name,known=excluded.known,target=excluded.target,level=excluded.level,slot=excluded.slot,goal=excluded.goal,bio=excluded.bio;
end $$;
create function private.daily_checkin() returns void language plpgsql security definer set search_path='' as $$
declare p public.profiles; today date=(now() at time zone 'Asia/Kolkata')::date;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform private.refresh_accountability();
 select * into p from public.profiles where id=auth.uid() for update;
 if p.id is null then raise exception 'Create your profile first'; end if;
 if p.cooldown_until>now() then raise exception 'Check-ins are paused during your cooldown'; end if;
 if p.last_checkin=today then return; end if;
 update public.profiles set completed=completed+1,streak=streak+1,last_checkin=today,last_evaluated=today where id=p.id;
end $$;
create function private.pair_partner(other_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare me public.profiles; other public.profiles; today date=(now() at time zone 'Asia/Kolkata')::date; lost int;
begin
 if auth.uid() is null or other_id=auth.uid() then raise exception 'Choose another learner'; end if;
 perform private.refresh_accountability();
 select * into me from public.profiles where id=auth.uid() for update;
 select * into other from public.profiles where id=other_id for update;
 if me.id is null or other.id is null then raise exception 'Learner profile unavailable'; end if;
 -- Recalculate a candidate's overdue commitment before allowing a pair.
 if other.last_evaluated<today then
  lost=greatest(0,today-other.last_evaluated-case when other.last_checkin=other.last_evaluated then 1 else 0 end);
  if lost>0 then
   if other.misses+lost>=3 and other.partner_id is not null then update public.profiles set partner_id=null where id=other.partner_id and partner_id=other.id; end if;
   update public.profiles set misses=misses+lost,streak=0,cooldown_until=case when misses+lost>=2 then now()+interval '24 hours' else null end,partner_id=case when misses+lost>=3 then null else partner_id end where id=other.id;
  end if;
  update public.profiles set last_evaluated=today where id=other.id;
  select * into other from public.profiles where id=other_id;
 end if;
 if me.partner_id is not null or other.partner_id is not null then raise exception 'One learner already has a partner'; end if;
 if me.cooldown_until>now() or other.cooldown_until>now() then raise exception 'Matching is paused during cooldown'; end if;
 if not(me.target=any(other.known) and other.target=any(me.known)) then raise exception 'This exchange is not reciprocal'; end if;
 update public.profiles set partner_id=other_id where id=me.id;
 update public.profiles set partner_id=me.id where id=other_id;
end $$;
create function private.claim_tutor_request() returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,810102));
 delete from private.tutor_requests where user_id=auth.uid() and requested_at<now()-interval '1 day';
 if (select count(*) from private.tutor_requests where user_id=auth.uid() and requested_at>now()-interval '1 minute')>=10 or (select count(*) from private.tutor_requests where user_id=auth.uid())>=100 then return false; end if;
 insert into private.tutor_requests(user_id) values(auth.uid());return true;
end $$;

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.refresh_accountability(),private.release_partner(),private.save_profile(text,text[],text,text,text,int,text),private.daily_checkin(),private.pair_partner(uuid),private.claim_tutor_request() to authenticated;
create function public.refresh_accountability() returns void language sql security invoker set search_path='' as $$select private.refresh_accountability();$$;
create function public.release_partner() returns void language sql security invoker set search_path='' as $$select private.release_partner();$$;
create function public.save_profile(p_name text,p_known text[],p_target text,p_level text,p_slot text,p_goal int,p_bio text) returns void language sql security invoker set search_path='' as $$select private.save_profile(p_name,p_known,p_target,p_level,p_slot,p_goal,p_bio);$$;
create function public.daily_checkin() returns void language sql security invoker set search_path='' as $$select private.daily_checkin();$$;
create function public.pair_partner(other_id uuid) returns void language sql security invoker set search_path='' as $$select private.pair_partner(other_id);$$;
create function public.claim_tutor_request() returns boolean language sql security invoker set search_path='' as $$select private.claim_tutor_request();$$;
revoke all on function public.refresh_accountability(),public.release_partner(),public.save_profile(text,text[],text,text,text,int,text),public.daily_checkin(),public.pair_partner(uuid),public.claim_tutor_request() from public,anon;
grant execute on function public.refresh_accountability(),public.release_partner(),public.save_profile(text,text[],text,text,text,int,text),public.daily_checkin(),public.pair_partner(uuid),public.claim_tutor_request() to authenticated;
commit;
-- Enable Realtime after the schema commits. Run these once in Supabase:
alter publication supabase_realtime add table public.profiles, public.peer_messages;
