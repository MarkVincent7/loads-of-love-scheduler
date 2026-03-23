-- Supabase Cron setup for Loads of Love reminder processing.
-- Run this in the Servingnetwork Supabase SQL editor after setting APP_URL and CRON_SECRET.
--
-- Official docs:
-- https://supabase.com/docs/guides/cron
-- https://supabase.com/docs/guides/functions/schedule-functions

-- Store secrets once. Replace values before running.
select vault.create_secret('https://loads-of-love-scheduler.vercel.app', 'loads_of_love_app_url');

select vault.create_secret('replace-with-your-cron-secret', 'loads_of_love_cron_secret');

-- Reminder emails still need a scheduler. This runs hourly from Supabase, not Vercel.
select cron.schedule(
  'loads-of-love-reminders-hourly',
  '0 * * * *',
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
