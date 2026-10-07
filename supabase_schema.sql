create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  phone text default '',
  role text check (role in ('patient', 'doctor', 'admin')) default 'patient',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  specialization text not null,
  department text not null,
  qualification text not null,
  experience int default 1,
  consultation_fee numeric default 50,
  approval_status text check (approval_status in ('pending', 'approved', 'rejected')) default 'approved',
  bio text default '',
  avatar text default 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=350',
  clinic_address text default 'City General Hospital, Main Wing, Room 302',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger 
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'phoneNumber', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;

create policy "Allow public read access to profiles"
  on public.profiles for select
  using (true);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow insert via trigger"
  on public.profiles for insert
  with check (true);

create policy "Allow public read access to doctors"
  on public.doctors for select
  using (true);

create policy "Allow doctors to insert their doctor details"
  on public.doctors for insert
  with check (auth.uid() = user_id);

create policy "Allow doctors to update their own record"
  on public.doctors for update
  using (auth.uid() = user_id);
