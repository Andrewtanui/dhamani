-- Fix for authentication issues: Add INSERT policy to profiles table
-- This allows the handle_new_user() trigger to create profiles for new users

-- Drop and recreate the trigger function to properly bypass RLS
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Log error but don't fail the user creation
  raise log 'Error creating profile for user %: %', new.id, SQLERRM;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Add INSERT policy for profiles table
create policy "profiles_insert_own" on profiles for insert
  with check (auth.uid() = id);
