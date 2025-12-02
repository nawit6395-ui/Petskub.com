-- Ensure we can check for duplicate email addresses before sign-up
create or replace function public.email_exists(target_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when target_email is null or length(trim(target_email)) = 0 then false
    else exists (
      select 1
      from auth.users
      where lower(email) = lower(trim(target_email))
    )
  end;
$$;

revoke all on function public.email_exists(text) from public;
grant execute on function public.email_exists(text) to anon;
grant execute on function public.email_exists(text) to authenticated;
