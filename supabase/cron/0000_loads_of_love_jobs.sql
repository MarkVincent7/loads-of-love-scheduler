-- Supabase Cron setup for Loads of Love reminder processing.
-- Run this in the Servingnetwork Supabase SQL editor after setting APP_URL and CRON_SECRET.
--
-- Official docs:
-- https://supabase.com/docs/guides/cron
-- https://supabase.com/docs/guides/functions/schedule-functions

do $$
declare
  app_url_secret_id uuid;
  cron_secret_id uuid;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'pg_cron is not enabled. In Supabase, go to Integrations > Cron and enable pg_cron first.';
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'pg_net is not enabled. In Supabase, go to Database > Extensions and enable pg_net first.';
  end if;

  if to_regnamespace('vault') is null then
    raise exception 'Vault is not enabled. Enable Vault in Supabase before running this SQL.';
  end if;

  select id
  into app_url_secret_id
  from vault.decrypted_secrets
  where name = 'loads_of_love_app_url'
  limit 1;

  if app_url_secret_id is null then
    perform vault.create_secret(
      'https://loads-of-love-scheduler.vercel.app',
      'loads_of_love_app_url',
      'Loads of Love app URL'
    );
  else
    perform vault.update_secret(
      app_url_secret_id,
      'https://loads-of-love-scheduler.vercel.app',
      'loads_of_love_app_url',
      'Loads of Love app URL'
    );
  end if;

  select id
  into cron_secret_id
  from vault.decrypted_secrets
  where name = 'loads_of_love_cron_secret'
  limit 1;

  if cron_secret_id is null then
    perform vault.create_secret(
      'replace-with-your-cron-secret',
      'loads_of_love_cron_secret',
      'Loads of Love cron bearer token'
    );
  else
    perform vault.update_secret(
      cron_secret_id,
      'replace-with-your-cron-secret',
      'loads_of_love_cron_secret',
      'Loads of Love cron bearer token'
    );
  end if;
end $$;

-- Reminder emails still need a scheduler. The app sends one reminder for registrations
-- whose appointment is tomorrow in Eastern Time. This job runs once per day.
--
-- Supabase Postgres defaults to UTC. The schedule below runs at 14:00 UTC.
-- Adjust the cron expression if you want a different daily send time.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'loads-of-love-reminders-hourly') then
    perform cron.unschedule('loads-of-love-reminders-hourly');
  end if;

  if exists (select 1 from cron.job where jobname = 'loads-of-love-reminders-daily') then
    perform cron.unschedule('loads-of-love-reminders-daily');
  end if;
end $$;

select cron.schedule(
  'loads-of-love-reminders-daily',
  '0 14 * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'loads_of_love_app_url') || '/api/cron/reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'loads_of_love_cron_secret')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
