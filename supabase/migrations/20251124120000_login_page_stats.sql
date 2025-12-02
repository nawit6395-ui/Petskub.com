-- Function exposing public daily participant counts for the login page
CREATE OR REPLACE FUNCTION public.get_daily_participant_count(
  target_date date DEFAULT (timezone('Asia/Bangkok', now()))::date
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.profiles
  WHERE (created_at AT TIME ZONE 'Asia/Bangkok')::date = target_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_participant_count(date) TO anon, authenticated;
